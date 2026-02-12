import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId } = req.body;

    // Get business details
    const business = await querySingle(
      'SELECT * FROM businesses WHERE id = $1',
      [businessId]
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

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

    // Activate owner account
    await query(
      `UPDATE users 
       SET is_active = true
       WHERE business_id = $1 AND role = 'owner'`,
      [businessId]
    );

    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    // Log approval (for email integration later)
    console.log('=== BUSINESS APPROVED ===');
    console.log('Business:', business.business_name);
    console.log('Owner Email:', business.email);
    console.log('Login URL: https://carwash-kenya.vercel.app/login');
    console.log('Trial Ends:', trialEndDate);
    console.log('========================');

    // TODO: Send approval email
    // Subject: "🎉 Your CarWash Pro Kenya Account is Approved!"
    // Body:
    // - "Your account has been approved!"
    // - "Login now: https://carwash-kenya.vercel.app/login"
    // - "Use the email and password you created during signup"
    // - "Your 30-day free trial ends on: [trialEndDate]"

    return res.status(200).json({
      success: true,
      message: 'Business approved successfully',
      business: business.business_name,
      email: business.email,
      trialEnds: trialEndDate
    });
  } catch (error) {
    console.error('Error approving business:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}