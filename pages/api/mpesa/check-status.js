import { querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID required'
      });
    }

    const payment = await querySingle(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        mpesaReceiptNumber: payment.mpesa_receipt_number,
        transactionDate: payment.transaction_date,
        createdAt: payment.created_at
      }
    });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
}