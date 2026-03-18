import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID required' 
      });
    }

    // Get customer details
    const customers = await query(
      `SELECT id, full_name, phone_number, outstanding_balance 
       FROM customers 
       WHERE id = $1`,
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const customer = customers[0];

    // Get all unpaid bookings for this customer
    const unpaidBookings = await query(
      `SELECT 
        b.id,
        b.created_at,
        b.final_amount,
        b.payment_status,
        b.payment_type,
        COALESCE(v.registration_number, 'Walk-in') as vehicle_reg,
        s.service_name,
        EXTRACT(DAY FROM (NOW() - b.created_at)) as days_old
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.customer_id = $1
         AND b.payment_status = 'unpaid'
         AND b.payment_type = 'credit'
       ORDER BY b.created_at ASC`,
      [customerId]
    );

    // Calculate total unpaid
    const totalUnpaid = unpaidBookings.reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

    console.log(`📋 Customer statement for ${customer.full_name}:`, {
      unpaidCount: unpaidBookings.length,
      totalUnpaid
    });

    return res.status(200).json({
      success: true,
      customer,
      unpaidBookings,
      totalUnpaid
    });

  } catch (error) {
    console.error('❌ Customer statement error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}