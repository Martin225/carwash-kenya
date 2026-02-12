import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId } = req.body;

    // Approve the business
    await query(
      `UPDATE businesses 
       SET approved_at = NOW(), 
           is_active = true,
           subscription_status = 'trial',
           trial_ends_at = NOW() + INTERVAL '30 days'
       WHERE id = $1`,
      [businessId]
    );

    return res.status(200).json({
      success: true,
      message: 'Business approved successfully'
    });
  } catch (error) {
    console.error('Error approving business:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}