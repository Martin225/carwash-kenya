import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    // Get all transactions
    const transactions = await query(`
      SELECT 
        bk.id,
        bk.booking_code,
        bk.final_amount,
        bk.status,
        bk.created_at,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        s.service_name
      FROM bookings bk
      JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      WHERE bk.branch_id = 1
      ORDER BY bk.created_at DESC
      LIMIT 50
    `);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => 
      t.created_at.toISOString().split('T')[0] === today
    );
    
    const completedToday = todayTransactions.filter(t => t.status === 'completed');
    const todayRevenue = completedToday.reduce((sum, t) => sum + parseFloat(t.final_amount), 0);

    // Monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      const txnDate = new Date(t.created_at);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.final_amount), 0);

    // Get inventory
    const inventory = await query(`
      SELECT * FROM inventory_items
      WHERE branch_id = 1
      ORDER BY 
        CASE WHEN current_stock <= reorder_level THEN 0 ELSE 1 END,
        current_stock ASC
    `);

    const stats = {
      todayRevenue,
      monthlyRevenue,
      totalBookings: transactions.length,
      completedToday: completedToday.length
    };

    return res.status(200).json({
      success: true,
      stats,
      transactions,
      inventory
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}