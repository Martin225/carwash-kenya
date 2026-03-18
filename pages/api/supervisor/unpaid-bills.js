import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch ID required' 
      });
    }

    console.log('📋 Fetching unpaid bills for branch:', branchId);

    // Get all customers with unpaid bookings
    const unpaidCustomers = await query(
      `SELECT 
        c.id as customer_id,
        c.full_name as customer_name,
        c.phone_number,
        c.outstanding_balance,
        COUNT(b.id) as unpaid_count,
        SUM(b.final_amount) as total_owed,
        MIN(b.created_at) as oldest_booking_date,
        MAX(b.created_at) as latest_booking_date
      FROM customers c
      JOIN bookings b ON c.id = b.customer_id
      WHERE b.branch_id = $1
        AND b.payment_status = 'unpaid'
        AND b.payment_type = 'credit'
      GROUP BY c.id, c.full_name, c.phone_number, c.outstanding_balance
      ORDER BY total_owed DESC`,
      [branchId]
    );

    console.log(`✅ Found ${unpaidCustomers.length} customers with unpaid bills`);

    return res.status(200).json({
      success: true,
      customers: unpaidCustomers
    });

  } catch (error) {
    console.error('❌ Unpaid bills API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}