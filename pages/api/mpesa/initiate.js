import { initiateSTKPush } from '../../../lib/mpesa';
import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, userId, phoneNumber, amount, paymentType } = req.body;

    if (!businessId || !userId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('=== PAYMENT INITIATION ===');
    console.log('Business ID:', businessId);
    console.log('Amount:', amount);
    console.log('Phone:', phoneNumber);
    console.log('=========================');

    // Initiate STK Push
    const stkResponse = await initiateSTKPush({
      phoneNumber,
      amount,
      accountReference: `BIZ${businessId}`,
      transactionDesc: paymentType === 'subscription' 
        ? 'CarWash Pro Monthly Subscription' 
        : 'CarWash Pro Payment'
    });

    if (!stkResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: stkResponse.error
      });
    }

    // Save payment record
    const payment = await querySingle(
      `INSERT INTO payments (
        business_id, user_id, amount, phone_number,
        merchant_request_id, checkout_request_id,
        payment_type, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *`,
      [
        businessId,
        userId,
        amount,
        phoneNumber,
        stkResponse.data.MerchantRequestID,
        stkResponse.data.CheckoutRequestID,
        paymentType || 'subscription'
      ]
    );

    console.log('=== PAYMENT RECORD CREATED ===');
    console.log('Payment ID:', payment.id);
    console.log('Checkout Request ID:', payment.checkout_request_id);
    console.log('=============================');

    return res.status(200).json({
      success: true,
      message: 'Payment initiated. Please check your phone for M-Pesa prompt.',
      data: {
        paymentId: payment.id,
        merchantRequestId: stkResponse.data.MerchantRequestID,
        checkoutRequestId: stkResponse.data.CheckoutRequestID,
        responseCode: stkResponse.data.ResponseCode,
        responseDescription: stkResponse.data.ResponseDescription,
        customerMessage: stkResponse.data.CustomerMessage
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment'
    });
  }
}