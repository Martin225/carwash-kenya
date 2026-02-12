import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    // Get all businesses
    const businesses = await query(
      `SELECT * FROM businesses 
       ORDER BY created_at DESC`
    );

    // Calculate stats
    const stats = {
      totalBusinesses: businesses.length,
      activeSubscriptions: businesses.filter(b => b.subscription_status === 'active').length,
      pendingApprovals: businesses.filter(b => !b.approved_at && b.email !== 'info@natsautomations.co.ke').length,
      monthlyRevenue: businesses.filter(b => b.subscription_status === 'active').length * 2000
    };

    return res.status(200).json({
      success: true,
      businesses,
      stats
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}