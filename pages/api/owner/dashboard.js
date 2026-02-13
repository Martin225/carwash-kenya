import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    const branches = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    if (branches.length === 0) {
      return res.status(200).json({
        success: true,
        stats: { todayRevenue: 0, monthlyRevenue: 0, totalBookings: 0, completedToday: 0 },
        transactions: [],
        inventory: []
      });
    }

    const branchIds = branches.map(b => b.id);

    const transactions = await query(
      `SELECT 
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
      WHERE bk.branch_id = ANY($1)
      ORDER BY bk.created_at DESC
      LIMIT 50`,
      [branchIds]
    );

    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => 
      t.created_at.toISOString().split('T')[0] === today
    );
    
    const completedToday = todayTransactions.filter(t => t.status === 'completed');
    const todayRevenue = completedToday.reduce((sum, t) => sum + parseFloat(t.final_amount), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      const txnDate = new Date(t.created_at);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.final_amount), 0);

    const inventory = await query(
      `SELECT * FROM inventory_items
       WHERE branch_id = ANY($1)
       ORDER BY 
         CASE WHEN current_stock <= reorder_level THEN 0 ELSE 1 END,
         current_stock ASC`,
      [branchIds]
    );

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