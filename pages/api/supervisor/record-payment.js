import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { bookingId, paymentMethod, paymentReference } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get booking details
    const booking = await querySingle(
      `SELECT b.*, c.phone_number as customer_phone, c.full_name as customer_name,
              v.registration_number, s.service_name, bus.business_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       JOIN services s ON b.service_id = s.id
       JOIN branches br ON b.branch_id = br.id
       JOIN businesses bus ON br.business_id = bus.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already recorded for this booking'
      });
    }

    // Update booking with payment details
    await query(
      `UPDATE bookings 
       SET payment_status = 'paid',
           payment_method = $1,
           payment_reference = $2,
           paid_at = NOW(),
           status = 'completed',
           updated_at = NOW()
       WHERE id = $3`,
      [paymentMethod, paymentReference || null, bookingId]
    );

    console.log('=== PAYMENT RECORDED ===');
    console.log('Booking ID:', bookingId);
    console.log('Payment Method:', paymentMethod);
    console.log('Reference:', paymentReference);
    console.log('Customer:', booking.customer_name);
    console.log('Phone:', booking.customer_phone);
    console.log('========================');

    // TODO: Send SMS here (we'll add this tomorrow!)
    // await sendSMS(booking.customer_phone, `Thank you for choosing ${booking.business_name}!...`);

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully!',
      booking: {
        id: booking.id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        vehicle_reg: booking.registration_number,
        service_name: booking.service_name,
        amount: booking.final_amount
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
}