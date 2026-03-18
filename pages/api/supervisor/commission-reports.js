import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { branchId, staffId, period, startDate, endDate, month, year } = req.query;

    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch ID required' 
      });
    }

    // Build date filter based on period or specific month
    let dateFilter = '';
    let dateParams = [branchId];
    let paramIndex = 2;

    if (month && year) {
      // Specific month selected
      dateFilter = `AND EXTRACT(MONTH FROM b.created_at) = $${paramIndex} 
                    AND EXTRACT(YEAR FROM b.created_at) = $${paramIndex + 1}`;
      dateParams.push(parseInt(month), parseInt(year));
      paramIndex += 2;
    } else if (period === 'week') {
      dateFilter = `AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (period === 'last_month') {
      dateFilter = `AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                    AND b.created_at < DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = `AND b.created_at::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      dateParams.push(startDate, endDate);
      paramIndex += 2;
    }

    // Build staff filter
    let staffFilter = '';
    if (staffId) {
      staffFilter = `AND s.id = $${paramIndex}`;
      dateParams.push(staffId);
      paramIndex++;
    }

    // Get commission data with staff splits
    const commissionsQuery = `
      WITH booking_staff_counts AS (
        SELECT 
          booking_id,
          COUNT(*) as staff_count
        FROM booking_staff
        GROUP BY booking_id
      ),
      staff_commissions AS (
        SELECT 
          s.id as staff_id,
          s.full_name as staff_name,
          s.commission_percentage,
          b.id as booking_id,
          b.created_at,
          b.final_amount,
          b.status,
          b.payment_status,
          b.payment_type,
          COALESCE(v.registration_number, 'Walk-in') as vehicle_reg,
          COALESCE(v.vehicle_type, 'N/A') as vehicle_type,
          COALESCE(srv.service_name, 'Car Wash') as service_name,
          c.full_name as customer_name,
          COALESCE(bsc.staff_count, 1) as staff_count,
          -- Calculate commission split
          (b.final_amount * (s.commission_percentage / 100.0)) / COALESCE(bsc.staff_count, 1) as commission_earned
        FROM bookings b
        LEFT JOIN booking_staff bs ON b.id = bs.booking_id
        LEFT JOIN staff s ON bs.staff_id = s.id OR (bs.staff_id IS NULL AND b.assigned_staff_id = s.id)
        LEFT JOIN booking_staff_counts bsc ON b.id = bsc.booking_id
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN services srv ON b.service_id = srv.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.branch_id = $1
          AND b.status = 'completed'
          ${dateFilter}
          ${staffFilter}
          AND s.id IS NOT NULL
      )
      SELECT * FROM staff_commissions
      ORDER BY created_at DESC
    `;

    const commissions = await query(commissionsQuery, dateParams);

    // Get staff summary with payment status
    const staffSummaryQuery = `
      WITH monthly_commissions AS (
        SELECT 
          s.id as staff_id,
          s.full_name as staff_name,
          s.commission_percentage,
          EXTRACT(MONTH FROM b.created_at) as month,
          EXTRACT(YEAR FROM b.created_at) as year,
          COUNT(DISTINCT b.id) as jobs_completed,
          SUM(b.final_amount) as total_revenue,
          SUM((b.final_amount * (s.commission_percentage / 100.0)) / 
              COALESCE((SELECT COUNT(*) FROM booking_staff WHERE booking_id = b.id), 1)) as total_commission
        FROM staff s
        LEFT JOIN booking_staff bs ON s.id = bs.staff_id
        LEFT JOIN bookings b ON bs.booking_id = b.id
        WHERE s.branch_id = $1
          AND (b.status = 'completed' OR b.status IS NULL)
          ${dateFilter.replace('b.created_at', 'COALESCE(b.created_at, NOW())')}
          ${staffFilter}
        GROUP BY s.id, s.full_name, s.commission_percentage, EXTRACT(MONTH FROM b.created_at), EXTRACT(YEAR FROM b.created_at)
        
        UNION ALL
        
        SELECT 
          s.id as staff_id,
          s.full_name as staff_name,
          s.commission_percentage,
          EXTRACT(MONTH FROM b.created_at) as month,
          EXTRACT(YEAR FROM b.created_at) as year,
          COUNT(DISTINCT b.id) as jobs_completed,
          SUM(b.final_amount) as total_revenue,
          SUM(b.final_amount * (s.commission_percentage / 100.0)) as total_commission
        FROM staff s
        LEFT JOIN bookings b ON s.id = b.assigned_staff_id
        WHERE s.branch_id = $1
          AND b.status = 'completed'
          ${dateFilter}
          ${staffFilter}
          AND NOT EXISTS (SELECT 1 FROM booking_staff bs2 WHERE bs2.booking_id = b.id)
        GROUP BY s.id, s.full_name, s.commission_percentage, EXTRACT(MONTH FROM b.created_at), EXTRACT(YEAR FROM b.created_at)
      )
      SELECT 
        mc.staff_id,
        mc.staff_name,
        mc.commission_percentage,
        SUM(mc.jobs_completed) as jobs_completed,
        SUM(mc.total_revenue) as total_revenue,
        SUM(mc.total_commission) as total_commission,
        cp.id as payment_id,
        cp.payment_date,
        cp.payment_notes,
        cp.recorded_at
      FROM monthly_commissions mc
      LEFT JOIN commission_payments cp ON 
        mc.staff_id = cp.staff_id AND
        mc.month = cp.payment_period_month AND
        mc.year = cp.payment_period_year
      WHERE mc.jobs_completed > 0
      GROUP BY mc.staff_id, mc.staff_name, mc.commission_percentage, 
               cp.id, cp.payment_date, cp.payment_notes, cp.recorded_at
      ORDER BY mc.staff_name
    `;

    const staffSummary = await query(staffSummaryQuery, dateParams);

    // Calculate totals
    const totals = {
      total_jobs: commissions.length,
      total_revenue: commissions.reduce((sum, c) => sum + parseFloat(c.final_amount || 0), 0),
      total_commission: commissions.reduce((sum, c) => sum + parseFloat(c.commission_earned || 0), 0),
      total_paid: staffSummary.filter(s => s.payment_id).reduce((sum, s) => sum + parseFloat(s.total_commission || 0), 0),
      total_unpaid: staffSummary.filter(s => !s.payment_id).reduce((sum, s) => sum + parseFloat(s.total_commission || 0), 0)
    };

    console.log('📊 Commission report generated:', {
      period: month && year ? `${year}-${month}` : period,
      jobs: totals.total_jobs,
      revenue: totals.total_revenue,
      commission: totals.total_commission,
      paid: totals.total_paid,
      unpaid: totals.total_unpaid
    });

    return res.status(200).json({
      success: true,
      commissions,
      staffSummary,
      totals
    });

  } catch (error) {
    console.error('❌ Commission reports error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}