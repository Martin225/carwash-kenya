import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customerId, amount, paymentMethod, paymentReference, receivedBy } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID and amount required' 
      });
    }

    // Get customer details
    const customers = await query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const customer = customers[0];

    // Get unpaid bookings (FIFO - oldest first)
    const unpaidBookings = await query(
      `SELECT id, final_amount, created_at
       FROM bookings
       WHERE customer_id = $1
         AND payment_status = 'unpaid'
         AND payment_type = 'credit'
       ORDER BY created_at ASC`,
      [customerId]
    );

    if (unpaidBookings.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No unpaid bookings found for this customer' 
      });
    }

    let remainingAmount = parseFloat(amount);
    let bookingsPaid = 0;
    const paidBookingIds = [];

    console.log(`💰 Processing payment of ${amount} for customer ${customer.full_name}`);

    // Allocate payment to bookings (FIFO)
    for (const booking of unpaidBookings) {
      if (remainingAmount <= 0) break;

      const bookingAmount = parseFloat(booking.final_amount);

      if (remainingAmount >= bookingAmount) {
        // Full payment for this booking
        await query(
          `UPDATE bookings 
           SET payment_status = 'paid',
               payment_method = $1,
               payment_reference = $2
           WHERE id = $3`,
          [paymentMethod, paymentReference, booking.id]
        );

        remainingAmount -= bookingAmount;
        bookingsPaid++;
        paidBookingIds.push(booking.id);

        console.log(`✅ Booking ${booking.id} fully paid (${bookingAmount})`);
      } else {
        // Partial payment - this is the last booking we can pay
        console.log(`⚠️ Partial payment: ${remainingAmount} remaining, booking needs ${bookingAmount}`);
        break;
      }
    }

    // Update customer outstanding balance
    const newBalance = Math.max(0, parseFloat(customer.outstanding_balance || 0) - parseFloat(amount));
    
    await query(
      'UPDATE customers SET outstanding_balance = $1 WHERE id = $2',
      [newBalance, customerId]
    );

    console.log(`📊 Customer balance updated: ${customer.outstanding_balance} → ${newBalance}`);

    // Record payment in payments table
    try {
      await query(
        `INSERT INTO payments (
          customer_id, amount, payment_method, payment_reference,
          received_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [customerId, amount, paymentMethod, paymentReference, receivedBy]
      );
      console.log('💾 Payment record created');
    } catch (paymentError) {
      console.log('⚠️ Could not create payment record (table may not exist):', paymentError.message);
    }

    // Send SMS notification (optional - will fail gracefully if SMS service not set up)
    try {
      const smsMessage = `Payment received: Kshs ${amount}. ${bookingsPaid} services paid. New balance: Kshs ${newBalance.toFixed(2)}. Thank you! - ${customer.business_name || 'CarWash'}`;
      
      // Try to send SMS if service is available
      if (customer.phone_number) {
        // Add your SMS sending logic here
        // Example: await sendSMS(customer.phone_number, smsMessage);
        console.log('📱 SMS would be sent to:', customer.phone_number);
      }
    } catch (smsError) {
      console.log('⚠️ SMS notification failed (non-critical):', smsError.message);
    }

    console.log(`✅ Payment processed: ${bookingsPaid} bookings paid, ${remainingAmount} remaining`);

    return res.status(200).json({
      success: true,
      message: `Payment recorded successfully`,
      bookingsPaid,
      amountApplied: parseFloat(amount) - remainingAmount,
      remainingAmount,
      newBalance
    });

  } catch (error) {
    console.error('❌ Collect payment error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}