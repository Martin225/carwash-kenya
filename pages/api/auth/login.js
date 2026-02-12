import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Get user with business details
    const user = await query(
      `SELECT u.*, b.business_name, b.subscription_status, b.trial_ends_at, b.is_active as business_active
       FROM users u
       LEFT JOIN businesses b ON u.business_id = b.id
       WHERE u.email = $1`,
      [email]
    );

    if (!user || user.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const userData = user[0];

    // Check if account is active
    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin confirmation.'
      });
    }

    if (!userData.business_active) {
      return res.status(403).json({
        success: false,
        message: 'Your business account is not active. Please contact support.'
      });
    }

    // Check password (for demo, simple comparison)
    // TODO: Use bcrypt in production: await bcrypt.compare(password, userData.password_hash)
    if (userData.password_hash !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userData.id]
    );

    return res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        business_id: userData.business_id,
        business_name: userData.business_name,
        subscription_status: userData.subscription_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}