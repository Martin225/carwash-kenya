import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, period } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    // Date ranges
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    // 1. REVENUE SUMMARY
    const revenueSummary = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE b.paid_at >= $2) as today_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE b.paid_at >= $2), 0) as today_revenue,
        COUNT(*) FILTER (WHERE b.paid_at >= $3) as week_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE b.paid_at >= $3), 0) as week_revenue,
        COUNT(*) FILTER (WHERE b.paid_at >= $4) as month_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE b.paid_at >= $4), 0) as month_revenue,
        COUNT(*) FILTER (WHERE b.paid_at >= $5) as year_count,
        COALESCE(SUM(b.final_amount) FILTER (WHERE b.paid_at >= $5), 0) as year_revenue,
        COUNT(*) as total_count,
        COALESCE(SUM(b.final_amount), 0) as total_revenue
       FROM bookings b
       JOIN branches br ON b.branch_id = br.id
       WHERE br.business_id = $1 AND b.payment_status = 'paid'`,
      [businessId, startOfDay, startOfWeek, startOfMonth, startOfYear]
    );

    // 2. PAYMENT METHOD BREAKDOWN (This Month)
    const paymentMethods = await query(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(b.final_amount), 0) as total
       FROM bookings b
       JOIN branches br ON b.branch_id = br.id
       WHERE br.business_id = $1 
         AND b.payment_status = 'paid'
         AND b.paid_at >= $2
       GROUP BY payment_method
       ORDER BY total DESC`,
      [businessId, startOfMonth]
    );

    // 3. DAILY REVENUE (Last 7 days)
    const dailyRevenue = await query(
      `SELECT 
        DATE(b.paid_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(b.final_amount), 0) as revenue
       FROM bookings b
       JOIN branches br ON b.branch_id = br.id
       WHERE br.business_id = $1 
         AND b.payment_status = 'paid'
         AND b.paid_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(b.paid_at)
       ORDER BY date ASC`,
      [businessId]
    );

    // 4. STAFF PERFORMANCE (This Month)
    const staffPerformance = await query(
  `SELECT 
    COALESCE(u.full_name, 'Unknown') as staff_name,
    COUNT(*) as cars_served,
    COALESCE(SUM(b.final_amount), 0) as revenue_generated
   FROM bookings b
   JOIN branches br ON b.branch_id = br.id
   LEFT JOIN users u ON b.assigned_staff_id = u.id
   WHERE br.business_id = $1 
     AND b.payment_status = 'paid'
     AND b.paid_at >= $2
   GROUP BY u.full_name
   ORDER BY revenue_generated DESC`,
  [businessId, startOfMonth]
);

    // 5. SERVICE BREAKDOWN (This Month)
    const serviceBreakdown = await query(
      `SELECT 
        s.service_name,
        COUNT(*) as count,
        COALESCE(SUM(b.final_amount), 0) as revenue
       FROM bookings b
       JOIN branches br ON b.branch_id = br.id
       JOIN services s ON b.service_id = s.id
       WHERE br.business_id = $1 
         AND b.payment_status = 'paid'
         AND b.paid_at >= $2
       GROUP BY s.service_name
       ORDER BY revenue DESC`,
      [businessId, startOfMonth]
    );

    // 6. RECENT TRANSACTIONS (Last 50)
    const transactions = await query(
  `SELECT 
    b.id,
    COALESCE(v.registration_number, 'Walk-in') as vehicle_reg,
    c.full_name as customer_name,
    c.phone_number as customer_phone,
    s.service_name,
    b.final_amount,
    b.payment_method,
    b.payment_reference,
    b.paid_at,
    br.branch_name
   FROM bookings b
   JOIN branches br ON b.branch_id = br.id
   JOIN customers c ON b.customer_id = c.id
   LEFT JOIN vehicles v ON b.vehicle_id = v.id
   JOIN services s ON b.service_id = s.id
   WHERE br.business_id = $1 
     AND b.payment_status = 'paid'
   ORDER BY b.paid_at DESC
   LIMIT 50`,
  [businessId]
);

    return res.status(200).json({
      success: true,
      data: {
        revenueSummary: revenueSummary[0],
        paymentMethods,
        dailyRevenue,
        staffPerformance,
        serviceBreakdown,
        transactions
      }
    });

  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load reports: ' + error.message
    });
  }
}