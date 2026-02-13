import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, days } = req.body;

    // Extend trial
    await query(
      `UPDATE businesses 
       SET trial_ends_at = trial_ends_at + INTERVAL '${days} days'
       WHERE id = $1`,
      [businessId]
    );

    const business = await querySingle(
      'SELECT business_name, email, trial_ends_at FROM businesses WHERE id = $1',
      [businessId]
    );

    console.log('=== TRIAL EXTENDED ===');
    console.log('Business:', business.business_name);
    console.log('Extended by:', days, 'days');
    console.log('New trial end:', new Date(business.trial_ends_at).toLocaleDateString());
    console.log('=====================');

    // TODO: Send email notification

    return res.status(200).json({
      success: true,
      message: `Trial extended by ${days} days`,
      newTrialEnd: business.trial_ends_at
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}