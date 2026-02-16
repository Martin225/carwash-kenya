import bcrypt from 'bcryptjs';
import { querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    const user = await querySingle(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password is hashed (starts with $2a$ or $2b$)
    let passwordMatch = false;

    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      // Hashed password - use bcrypt
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Plain text password (old accounts) - direct comparison
      passwordMatch = (password === user.password_hash);
    }

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    let business = null;
    if (user.business_id) {
      business = await querySingle(
        'SELECT * FROM businesses WHERE id = $1',
        [user.business_id]
      );

      if (business && user.role !== 'super_admin') {
        if (business.trial_ends_at) {
          const trialEnd = new Date(business.trial_ends_at);
          const today = new Date();
          
          if (today > trialEnd && business.subscription_status !== 'active') {
            return res.status(403).json({
              success: false,
              message: '⛔ Your subscription has expired. Please renew to continue.\n\nContact: +254 726 259 977\nEmail: info@natsautomations.co.ke'
            });
          }
        }
      }
    }

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      business_id: user.business_id,
      business_name: business?.business_name,
      trial_ends_at: business?.trial_ends_at,
      subscription_status: business?.subscription_status
    };

    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', user.full_name);
    console.log('Role:', user.role);
    console.log('Business:', business?.business_name);
    console.log('Trial Ends:', business?.trial_ends_at);
    console.log('====================');

    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
}