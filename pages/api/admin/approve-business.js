import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId } = req.body;

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

    await query(
      `UPDATE businesses 
       SET approved_at = NOW(), 
           is_active = true,
           subscription_status = 'trial',
           trial_ends_at = NOW() + INTERVAL '30 days'
       WHERE id = $1`,
      [businessId]
    );

    await query(
      `UPDATE users 
       SET is_active = true
       WHERE business_id = $1 AND role = 'owner'`,
      [businessId]
    );

    const existingBranch = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    if (existingBranch.length === 0) {
      const branch = await querySingle(
        `INSERT INTO branches (business_id, branch_name, branch_code, address, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [businessId, business.business_name + ' - Main Branch', 'MAIN-' + businessId, business.location || 'Nairobi']
      );

      for (let i = 1; i <= 4; i++) {
        await query(
          `INSERT INTO bays (branch_id, bay_number, bay_name, status, is_active)
           VALUES ($1, $2, $3, 'available', true)`,
          [branch.id, i, `Bay ${i}`]
        );
      }

      console.log('Branch and 4 bays created for:', business.business_name);
    }

    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    console.log('=== BUSINESS APPROVED ===');
    console.log('Business:', business.business_name);
    console.log('Owner Email:', business.email);
    console.log('Trial Ends:', trialEndDate);
    console.log('========================');

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