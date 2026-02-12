import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessName, ownerName, email, phone, location, password } = req.body;

    // Check if email already exists
    const existing = await query(
      'SELECT id FROM businesses WHERE email = $1',
      [email]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please use a different email.' 
      });
    }

    // Create business (pending approval)
    const business = await query(
      `INSERT INTO businesses (
        business_name, 
        owner_name, 
        email, 
        phone, 
        location, 
        subscription_status, 
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', false)
      RETURNING id`,
      [businessName, ownerName, email, phone, location]
    );

    const businessId = business[0].id;

    // Save user's chosen password (not temp password)
    // TODO: Hash password with bcrypt in production
    await query(
      `INSERT INTO users (
        business_id, 
        full_name, 
        email, 
        phone, 
        role, 
        is_active, 
        password_hash
      )
      VALUES ($1, $2, $3, $4, 'owner', false, $5)`,
      [businessId, ownerName, email, phone, password] // Their password, not temp
    );

    // Log for admin
    console.log('=== NEW BUSINESS REGISTRATION ===');
    console.log('Business:', businessName);
    console.log('Owner:', ownerName);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Status: Pending approval');
    console.log('================================');

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! You will receive an email once approved.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
}