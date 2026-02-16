import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const callbackData = req.body;

    console.log('=== M-PESA CALLBACK RECEIVED ===');
    console.log('Full Data:', JSON.stringify(callbackData, null, 2));
    console.log('================================');

    const { Body } = callbackData;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.log('No stkCallback in request');
      return res.status(200).json({ success: true });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    } = stkCallback;

    // Find payment record
    const payment = await querySingle(
      'SELECT * FROM payments WHERE checkout_request_id = $1',
      [CheckoutRequestID]
    );

    if (!payment) {
      console.log('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({ success: true });
    }

    // Payment successful
    if (ResultCode === 0) {
      const { CallbackMetadata } = stkCallback;
      const items = CallbackMetadata?.Item || [];

      // Extract payment details
      const amount = items.find(i => i.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = items.find(i => i.Name === 'TransactionDate')?.Value;
      const phoneNumber = items.find(i => i.Name === 'PhoneNumber')?.Value;

      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'completed',
             mpesa_receipt_number = $1,
             transaction_date = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [mpesaReceiptNumber, new Date(), payment.id]
      );

      console.log('=== PAYMENT SUCCESSFUL ===');
      console.log('Receipt:', mpesaReceiptNumber);
      console.log('Amount:', amount);
      console.log('=========================');

      // If subscription payment, extend/activate subscription
      if (payment.payment_type === 'subscription') {
        const business = await querySingle(
          'SELECT * FROM businesses WHERE id = $1',
          [payment.business_id]
        );

        if (business) {
          const currentEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : new Date();
          const now = new Date();
          
          // If trial hasn't ended or already expired, start from now
          const startDate = currentEnd > now ? currentEnd : now;
          
          // Add 30 days
          const newEndDate = new Date(startDate);
          newEndDate.setDate(newEndDate.getDate() + 30);

          await query(
            `UPDATE businesses 
             SET subscription_status = 'active',
                 trial_ends_at = $1,
                 is_active = true,
                 updated_at = NOW()
             WHERE id = $2`,
            [newEndDate, payment.business_id]
          );

          console.log('=== SUBSCRIPTION EXTENDED ===');
          console.log('Business ID:', payment.business_id);
          console.log('New End Date:', newEndDate);
          console.log('============================');
        }
      }
    } else {
      // Payment failed
      await query(
        `UPDATE payments 
         SET status = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [payment.id]
      );

      console.log('=== PAYMENT FAILED ===');
      console.log('Result Code:', ResultCode);
      console.log('Result Desc:', ResultDesc);
      console.log('=====================');
    }

    // Always return 200 to M-Pesa
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    // Still return 200 to prevent M-Pesa retries
    return res.status(200).json({ success: true });
  }
}