import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, period = '30' } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    // Get revenue trend
    const revenueTrend = await query(`
      SELECT 
        DATE(b.created_at) as date,
        COUNT(*) as bookings_count,
        SUM(CASE WHEN b.payment_status = 'paid' THEN b.final_amount ELSE 0 END) as revenue
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND b.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY DATE(b.created_at)
      ORDER BY date ASC
    `, [businessId]);

    // Get current month stats
    const currentMonth = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.payment_status = 'paid' THEN 1 END) as paid_bookings,
        SUM(CASE WHEN b.payment_status = 'paid' THEN b.final_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN b.payment_status = 'paid' THEN b.final_amount END) as avg_transaction
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, [businessId]);

    // Get staff commissions
    const staffCommissions = await query(`
      SELECT 
        SUM(st.commission_per_car) as total_commissions
      FROM bookings b
      JOIN staff st ON b.assigned_staff_id = st.id
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND b.payment_status = 'paid'
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, [businessId]);

    // Get expenses
    const expenses = await query(`
      SELECT 
        category,
        SUM(amount) as total
      FROM expenses
      WHERE business_id = $1
        AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY category
    `, [businessId]);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.total || 0), 0);
    const totalCommissions = parseFloat(staffCommissions[0]?.total_commissions || 0);
    const totalCosts = totalExpenses + totalCommissions;
    
    const monthRevenue = parseFloat(currentMonth[0]?.total_revenue || 0);
    const netProfit = monthRevenue - totalCosts;
    const profitMargin = monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(2) : 0;
    const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(2) : 0;

    // Service breakdown
    const serviceBreakdown = await query(`
      SELECT 
        s.service_name,
        COUNT(*) as count,
        SUM(b.final_amount) as revenue
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND b.payment_status = 'paid'
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY s.service_name
      ORDER BY revenue DESC
    `, [businessId]);

    // Staff performance
    const staffPerformance = await query(`
      SELECT 
        st.full_name as staff_name,
        COUNT(*) as cars_washed,
        SUM(b.final_amount) as revenue_generated,
        SUM(st.commission_per_car) as total_commission
      FROM bookings b
      JOIN staff st ON b.assigned_staff_id = st.id
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND b.payment_status = 'paid'
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY st.full_name, st.id
      ORDER BY revenue_generated DESC
    `, [businessId]);

    // Previous month comparison
    const previousMonth = await query(`
      SELECT 
        SUM(CASE WHEN b.payment_status = 'paid' THEN b.final_amount ELSE 0 END) as revenue
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `, [businessId]);

    const prevMonthRevenue = parseFloat(previousMonth[0]?.revenue || 0);
    const growthRate = prevMonthRevenue > 0 
      ? (((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(2)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBookings: parseInt(currentMonth[0]?.total_bookings || 0),
          paidBookings: parseInt(currentMonth[0]?.paid_bookings || 0),
          totalRevenue: monthRevenue,
          avgTransaction: parseFloat(currentMonth[0]?.avg_transaction || 0),
          totalExpenses,
          staffCommissions: totalCommissions,
          totalCosts,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          roi: parseFloat(roi),
          growthRate: parseFloat(growthRate)
        },
        revenueTrend: revenueTrend.map(r => ({
          date: r.date,
          bookings: parseInt(r.bookings_count),
          revenue: parseFloat(r.revenue || 0)
        })),
        expenseBreakdown: expenses.map(e => ({
          category: e.category,
          amount: parseFloat(e.total)
        })),
        serviceBreakdown: serviceBreakdown.map(s => ({
          name: s.service_name,
          count: parseInt(s.count),
          revenue: parseFloat(s.revenue)
        })),
        staffPerformance: staffPerformance.map(s => ({
          name: s.staff_name,
          carsWashed: parseInt(s.cars_washed),
          revenue: parseFloat(s.revenue_generated),
          commission: parseFloat(s.total_commission)
        }))
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics: ' + error.message
    });
  }
}