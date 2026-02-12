import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const reset = await querySingle(
      `SELECT * FROM password_resets 
       WHERE reset_token = $1 
         AND expires_at > NOW() 
         AND used = false`,
      [token]
    );

    if (!reset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update user password
    // TODO: Hash password with bcrypt in production
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPassword, reset.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_resets SET used = true WHERE id = $1',
      [reset.id]
    );

    console.log('Password reset successful for user ID:', reset.user_id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}