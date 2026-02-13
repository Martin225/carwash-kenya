import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId } = req.body;

    // Reactivate business
    await query(
      `UPDATE businesses 
       SET subscription_status = 'active', 
           is_active = true
       WHERE id = $1`,
      [businessId]
    );

    await query(
      `UPDATE users 
       SET is_active = true
       WHERE business_id = $1`,
      [businessId]
    );

    const business = await querySingle(
      'SELECT business_name, email FROM businesses WHERE id = $1',
      [businessId]
    );

    console.log('=== BUSINESS REACTIVATED ===');
    console.log('Business:', business.business_name);
    console.log('Email:', business.email);
    console.log('===========================');

    // TODO: Send reactivation email

    return res.status(200).json({
      success: true,
      message: 'Business reactivated successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}