import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch ID required' });
    }

    const branch = await querySingle(`
      SELECT 
        b.*,
        COUNT(DISTINCT bay.id) as bay_count,
        COUNT(DISTINCT s.id) as staff_count
      FROM branches b
      LEFT JOIN bays bay ON b.id = bay.branch_id
      LEFT JOIN staff s ON b.id = s.branch_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [branchId]);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const transactions = await query(`
      SELECT * FROM bookings 
      WHERE branch_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [branchId]);

    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => 
      t.created_at && t.created_at.toISOString().split('T')[0] === today
    );
    
    const completedToday = todayTransactions.filter(t => t.status === 'completed');
    const todayRevenue = completedToday.reduce((sum, t) => sum + parseFloat(t.final_amount || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      if (!t.created_at) return false;
      const txnDate = new Date(t.created_at);
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.final_amount || 0), 0);

    const bays = await query('SELECT * FROM bays WHERE branch_id = $1', [branchId]);
    const activeBays = bays.filter(b => b.status === 'occupied').length;

    const stats = {
      todayRevenue,
      monthlyRevenue,
      totalBookings: transactions.length,
      activeBays
    };

    return res.status(200).json({
      success: true,
      branch,
      stats
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}