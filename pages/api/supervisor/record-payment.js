import { query, querySingle } from '../../../lib/db';
import { sendSMS } from '../../../lib/sms';

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
              COALESCE(v.registration_number, 'Walk-in Service') as registration_number, 
              s.service_name, bus.business_name
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

    // SEND SMS - THIS IS THE CRITICAL PART!
    console.log('🚀 ABOUT TO SEND SMS...');
    
    const smsMessage = `Thank you for choosing ${booking.business_name}!\n\nVehicle: ${booking.registration_number}\nService: ${booking.service_name}\nAmount: Kshs ${booking.final_amount}\n\nWe look forward to serving you again! 🚗✨`;

    let smsResult = { success: false, error: 'SMS not attempted' };
    
    try {
      console.log('📱 Calling sendSMS function...');
      smsResult = await sendSMS(booking.customer_phone, smsMessage);
      console.log('📬 SMS function returned:', smsResult);
    } catch (smsError) {
      console.error('💥 SMS EXCEPTION:', smsError);
      smsResult = { success: false, error: smsError.message };
    }

    if (smsResult.success) {
      console.log('✅ SMS sent successfully!');
    } else {
      console.error('❌ SMS failed:', smsResult.error);
    }

    return res.status(200).json({
      success: true,
      message: smsResult.success 
        ? 'Payment recorded successfully! SMS sent to customer.' 
        : 'Payment recorded but SMS failed to send.',
      booking: {
        id: booking.id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        vehicle_reg: booking.registration_number,
        service_name: booking.service_name,
        amount: booking.final_amount
      },
      sms: smsResult
    });
  } catch (error) {
    console.error('💥 RECORD PAYMENT ERROR:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment: ' + error.message
    });
  }
}