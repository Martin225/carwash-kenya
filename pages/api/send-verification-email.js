import { Resend } from 'resend';
import { query } from '../../lib/db';
import { generateVerificationToken, generateVerificationLink } from '../../lib/verification';
import { getVerificationEmail } from '../../lib/email-templates';

export default async function handler(req, res) {
  console.log('========================================');
  console.log('🔔 SEND VERIFICATION EMAIL API CALLED!');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('========================================');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, ownerName, businessName, email } = req.body;

    // Initialize Resend with API key
    const apiKey = process.env.RESEND_API_KEY;
    console.log('📧 API Key exists:', apiKey ? 'YES' : 'NO');
    console.log('📧 API Key starts with re_:', apiKey?.startsWith('re_') ? 'YES' : 'NO');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables');
    }

    const resend = new Resend(apiKey);

    // Generate verification token
    const token = generateVerificationToken();
    const verificationLink = generateVerificationLink(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      token
    );

    console.log('📧 Verification link:', verificationLink);

    // Save token to database
    await query(
      `UPDATE businesses 
       SET verification_token = $1, verification_sent_at = NOW()
       WHERE id = $2`,
      [token, businessId]
    );

    console.log('📧 Token saved to database');

    // Get email template
    const emailContent = getVerificationEmail(ownerName, businessName, verificationLink);

    console.log('📧 Sending email to:', email);

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'CarWash Pro <verify@smartwash.natsautomations.co.ke>',
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    console.log('=== VERIFICATION EMAIL SENT ===');
    console.log('To:', email);
    console.log('Business:', businessName);
    console.log('Resend Response:', data);
    console.log('Resend ID:', data?.id);
    console.log('==============================');

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      emailId: data?.id
    });
  } catch (error) {
    console.error('❌ EMAIL SENDING ERROR:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification email'
    });
  }
}