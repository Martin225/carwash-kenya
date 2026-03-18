import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, period, month, year, startDate, endDate } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    // Build date filter based on parameters
    let dateFilter = '';
    let dateParams = [businessId];
    let paramIndex = 2;

    if (month && year) {
      // Specific month (e.g., November 2024)
      dateFilter = `AND EXTRACT(MONTH FROM COALESCE(b.paid_at, b.created_at)) = $${paramIndex} 
                    AND EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = $${paramIndex + 1}`;
      dateParams.push(parseInt(month), parseInt(year));
      paramIndex += 2;
      console.log('📅 Filtering by month:', month, 'year:', year);
    } else if (year && !month) {
      // Entire year (e.g., all of 2024)
      dateFilter = `AND EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = $${paramIndex}`;
      dateParams.push(parseInt(year));
      paramIndex++;
      console.log('📅 Filtering by year:', year);
    } else if (period === 'week') {
      // Last 7 days
      dateFilter = `AND COALESCE(b.paid_at, b.created_at) >= CURRENT_DATE - INTERVAL '7 days'`;
      console.log('📅 Filtering: last 7 days');
    } else if (startDate && endDate) {
      // Custom date range
      dateFilter = `AND COALESCE(b.paid_at, b.created_at)::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      dateParams.push(startDate, endDate);
      paramIndex += 2;
      console.log('📅 Filtering: custom range', startDate, 'to', endDate);
    } else {
      // No filter - show all time
      console.log('📅 No date filter - showing all transactions');
    }

    // 1. GET ALL TRANSACTIONS WITH FILTER
    const transactionsQuery = `
      SELECT 
        b.id,
        COALESCE(b.paid_at, b.created_at) as paid_at,
        b.created_at,
        b.final_amount,
        b.payment_method,
        b.payment_reference,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        s.service_name,
        st.full_name as staff_name,
        br.branch_name
      FROM bookings b
      LEFT JOIN branches br ON b.branch_id = br.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN staff st ON b.assigned_staff_id = st.id
      WHERE br.business_id = $1
        AND b.status = 'completed'
        ${dateFilter}
      ORDER BY COALESCE(b.paid_at, b.created_at) DESC
    `;

    const transactions = await query(transactionsQuery, dateParams);

    // 2. REVENUE SUMMARY (always show all-time for comparison)
    const revenueSummary = await query(
      `SELECT 
        -- Today
        COUNT(*) FILTER (WHERE DATE(COALESCE(b.paid_at, b.created_at)) = CURRENT_DATE AND b.status = 'completed') as today_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE DATE(COALESCE(b.paid_at, b.created_at)) = CURRENT_DATE AND b.status = 'completed'), 0) as today_revenue,
        
        -- This Week
        COUNT(*) FILTER (WHERE COALESCE(b.paid_at, b.created_at) >= CURRENT_DATE - INTERVAL '7 days' AND b.status = 'completed') as week_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE COALESCE(b.paid_at, b.created_at) >= CURRENT_DATE - INTERVAL '7 days' AND b.status = 'completed'), 0) as week_revenue,
        
        -- This Month
        COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE) 
                          AND EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
                          AND b.status = 'completed') as month_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE EXTRACT(MONTH FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(MONTH FROM CURRENT_DATE) 
                                             AND EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE)
                                             AND b.status = 'completed'), 0) as month_revenue,
        
        -- This Year
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) AND b.status = 'completed') as year_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE EXTRACT(YEAR FROM COALESCE(b.paid_at, b.created_at)) = EXTRACT(YEAR FROM CURRENT_DATE) AND b.status = 'completed'), 0) as year_revenue,
        
        -- All Time
        COUNT(*) FILTER (WHERE b.status = 'completed') as total_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE b.status = 'completed'), 0) as total_revenue
       FROM bookings b
       LEFT JOIN branches br ON b.branch_id = br.id
       WHERE br.business_id = $1`,
      [businessId]
    );

    // 3. PAYMENT METHODS (use same date filter)
    const paymentMethodsQuery = `
      SELECT 
        b.payment_method,
        COUNT(*) as count,
        SUM(b.final_amount) as total
      FROM bookings b
      LEFT JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND b.status = 'completed'
        ${dateFilter}
      GROUP BY b.payment_method
      ORDER BY total DESC
    `;

    const paymentMethods = await query(paymentMethodsQuery, dateParams);

    // 4. DAILY REVENUE (last 7 days)
    const dailyRevenue = await query(
      `SELECT 
        DATE(COALESCE(b.paid_at, b.created_at)) as date,
        COUNT(*) as count,
        SUM(b.final_amount) as revenue
       FROM bookings b
       LEFT JOIN branches br ON b.branch_id = br.id
       WHERE br.business_id = $1
         AND b.status = 'completed'
         AND COALESCE(b.paid_at, b.created_at) >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(COALESCE(b.paid_at, b.created_at))
       ORDER BY date DESC
       LIMIT 7`,
      [businessId]
    );

    // 5. STAFF PERFORMANCE (use same date filter)
    const staffPerformanceQuery = `
      SELECT 
        st.full_name as staff_name,
        COUNT(b.id) as cars_served,
        SUM(b.final_amount) as revenue_generated
      FROM bookings b
      LEFT JOIN branches br ON b.branch_id = br.id
      LEFT JOIN staff st ON b.assigned_staff_id = st.id
      WHERE br.business_id = $1
        AND b.status = 'completed'
        ${dateFilter}
        AND st.id IS NOT NULL
      GROUP BY st.id, st.full_name
      ORDER BY revenue_generated DESC
      LIMIT 10
    `;

    const staffPerformance = await query(staffPerformanceQuery, dateParams);

    // 6. SERVICE BREAKDOWN (use same date filter)
    const serviceBreakdownQuery = `
      SELECT 
        s.service_name,
        COUNT(b.id) as count,
        SUM(b.final_amount) as revenue
      FROM bookings b
      LEFT JOIN branches br ON b.branch_id = br.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE br.business_id = $1
        AND b.status = 'completed'
        ${dateFilter}
        AND s.id IS NOT NULL
      GROUP BY s.id, s.service_name
      ORDER BY revenue DESC
    `;

    const serviceBreakdown = await query(serviceBreakdownQuery, dateParams);

    console.log('✅ Reports loaded:', {
      transactions: transactions.length,
      dateFilter: dateFilter || 'none',
      params: dateParams
    });

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        revenueSummary: revenueSummary[0] || {},
        paymentMethods,
        dailyRevenue,
        staffPerformance,
        serviceBreakdown
      }
    });

  } catch (error) {
    console.error('❌ Reports API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}