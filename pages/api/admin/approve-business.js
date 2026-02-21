import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, trialDays } = req.body;

    // Validate trial days (default to 30 if not provided)
    const days = trialDays && trialDays > 0 ? trialDays : 30;

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

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + days);

    // Approve business with custom trial period
    await query(
      `UPDATE businesses 
       SET approved_at = NOW(), 
           is_active = true,
           subscription_status = 'trial',
           trial_ends_at = $2
       WHERE id = $1`,
      [businessId, trialEndDate]
    );

    // Activate owner account
    await query(
      `UPDATE users 
       SET is_active = true
       WHERE business_id = $1 AND role = 'owner'`,
      [businessId]
    );

    // Check if branch exists
    const existingBranch = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    // Create default branch and bays if doesn't exist
    if (existingBranch.length === 0) {
      const branch = await querySingle(
        `INSERT INTO branches (business_id, branch_name, branch_code, address, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [businessId, business.business_name + ' - Main Branch', 'MAIN-' + businessId, business.location || 'Nairobi']
      );

      // Create 4 default bays
      for (let i = 1; i <= 4; i++) {
        await query(
          `INSERT INTO bays (branch_id, bay_number, bay_name, status, is_active)
           VALUES ($1, $2, $3, 'available', true)`,
          [branch.id, i, `Bay ${i}`]
        );
      }
      console.log('✅ Branch and 4 bays created for:', business.business_name);
    }

    console.log('=== BUSINESS APPROVED ===');
    console.log('Business:', business.business_name);
    console.log('Plan:', (business.subscription_plan || 'basic').toUpperCase());
    console.log('Owner Email:', business.email);
    console.log('Trial Days:', days);
    console.log('Trial Ends:', trialEndDate.toLocaleDateString());
    console.log('========================');

    // TODO: Send welcome email here
    // await sendWelcomeEmail(business.email, business.owner_name, business.business_name, trialEndDate);

    return res.status(200).json({
      success: true,
      message: `Business approved with ${days} days trial!`,
      business: business.business_name,
      email: business.email,
      plan: business.subscription_plan || 'basic',
      trialDays: days,
      trialEnds: trialEndDate.toLocaleDateString()
    });

  } catch (error) {
    console.error('Error approving business:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}