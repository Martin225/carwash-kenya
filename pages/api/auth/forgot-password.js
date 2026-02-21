import { Resend } from 'resend';
import { query, querySingle } from '../../../lib/db';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('=== PASSWORD RESET REQUEST ===');
    console.log('Email:', email);

    // Check if user exists
    const user = await querySingle(
      'SELECT id, email, full_name, role FROM users WHERE email = $1',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      console.log('User not found - returning generic success message');
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent to your inbox.'
      });
    }

    console.log('User found:', user.full_name, '- Role:', user.role);

    // Generate 6-digit reset code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET reset_token = $2, expires_at = $3, created_at = NOW()`,
      [user.id, resetToken, expiresAt]
    );

    console.log('Reset token generated:', resetToken);
    console.log('Expires at:', expiresAt.toLocaleString());

    // Build reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('Reset URL:', resetUrl);

    //// Send email
    try {
      console.log('📧 Attempting to send email...');
      console.log('To:', email);
      console.log('From: CarWash Pro <noreply@natsautomations.com>');
      
      const emailResult = await resend.emails.send({
        from: 'CarWash Pro <verify@smartwash.natsautomations.co.ke>',
        to: email,
        subject: '🔐 Reset Your Password - CarWash Pro Kenya',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #006633 0%, #004d26 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">CarWash Pro Kenya</p>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="background: white; padding: 40px 30px; border-left: 2px solid #e0e0e0; border-right: 2px solid #e0e0e0;">
                        <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
                          Hi <strong>${user.full_name}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 30px 0;">
                          We received a request to reset your password for your CarWash Pro account. Use the code below or click the button to reset your password:
                        </p>
                        
                        <!-- Reset Code Box -->
                        <div style="background: #f9f9f9; border: 2px dashed #006633; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                          <p style="font-size: 36px; font-weight: bold; color: #006633; margin: 0; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                            ${resetToken}
                          </p>
                        </div>
                        
                        <!-- Reset Button -->
                        <div style="text-align: center; margin: 0 0 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background: #006633; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Reset Password Now
                          </a>
                        </div>
                        
                        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 0 0 30px 0;">
                          <p style="margin: 0; font-size: 14px; color: #666;">
                               ⏰ This code expires in 1 hour
                          </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
                          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background: #f9f9f9; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                          <strong>CarWash Pro Kenya</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          Powered by Nats Automations Ltd<br>
                          <a href="https://natsautomations.com" style="color: #006633; text-decoration: none;">www.natsautomations.com</a>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      console.log('📧 Resend API Response:', JSON.stringify(emailResult, null, 2));

      if (emailResult.data?.id) {
  console.log('✅ Email sent successfully!');
  console.log('Email ID:', emailResult.data.id);
} else if (emailResult.error) {
  console.error('❌ Resend returned error:', emailResult.error);
} else {
  console.warn('⚠️ Unexpected response from Resend:', emailResult);
}

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Error details:', JSON.stringify(emailError, null, 2));
      // Still return success to user (security)
    }

    console.log('============================');

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent to your inbox.',
      // Include in development only
      ...(process.env.NODE_ENV === 'development' && {
        dev_resetToken: resetToken,
        dev_resetUrl: resetUrl
      })
    });

    console.log('============================');

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent to your inbox.',
      // Include in development only
      ...(process.env.NODE_ENV === 'development' && {
        dev_resetToken: resetToken,
        dev_resetUrl: resetUrl
      })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
}