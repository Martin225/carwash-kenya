import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      staffId, 
      businessId,
      month, 
      year, 
      commissionAmount, 
      jobsCount,
      paymentDate,  // Actual payment date (can be backdated)
      paymentNotes,
      recordedBy  // Owner user ID
    } = req.body;

    if (!staffId || !businessId || !month || !year || !commissionAmount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, businessId, month, year, commissionAmount, paymentDate'
      });
    }

    // Check if already paid for this period
    const existing = await query(
      `SELECT id FROM commission_payments 
       WHERE staff_id = $1 
       AND payment_period_month = $2 
       AND payment_period_year = $3`,
      [staffId, month, year]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission for this period has already been marked as paid'
      });
    }

    // Record payment
    const payment = await querySingle(
      `INSERT INTO commission_payments (
        staff_id, 
        business_id,
        payment_period_month, 
        payment_period_year,
        commission_amount,
        jobs_count,
        payment_date,
        payment_notes,
        recorded_by,
        recorded_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        staffId, 
        businessId,
        month, 
        year, 
        commissionAmount, 
        jobsCount || 0,
        paymentDate,
        paymentNotes || null,
        recordedBy
      ]
    );

    console.log('✅ Commission payment recorded:', {
      staffId,
      period: `${year}-${month}`,
      amount: commissionAmount,
      paymentDate
    });

    return res.status(201).json({
      success: true,
      message: 'Commission marked as paid successfully',
      payment
    });

  } catch (error) {
    console.error('❌ Record commission payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}