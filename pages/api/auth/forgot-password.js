import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Check if user exists
    const user = await querySingle(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent'
      });
    }

    // Generate reset token (6-digit code valid for 1 hour)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET reset_token = $2, expires_at = $3, created_at = NOW()`,
      [user.id, resetToken, expiresAt]
    );

    // Log for development (send via email in production)
    console.log('=== PASSWORD RESET REQUEST ===');
    console.log('Email:', email);
    console.log('User:', user.full_name);
    console.log('Reset Code:', resetToken);
    console.log('Expires:', expiresAt.toLocaleString());
    console.log('Reset URL: http://localhost:3000/reset-password?token=' + resetToken);
    console.log('============================');

    // TODO: Send email with reset link
    // Subject: "Reset Your CarWash Pro Password"
    // Body: "Your reset code is: [resetToken]"
    // Or: "Click here to reset: https://carwash-kenya.vercel.app/reset-password?token=[resetToken]"

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
      // Remove in production:
      devOnly_resetToken: resetToken,
      devOnly_resetUrl: `http://localhost:3000/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}