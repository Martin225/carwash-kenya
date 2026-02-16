import { query, querySingle } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find business with this token
    const business = await querySingle(
      'SELECT * FROM businesses WHERE verification_token = $1',
      [token]
    );

    if (!business) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    if (business.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Mark email as verified
    await query(
      `UPDATE businesses 
       SET email_verified = true, verification_token = NULL
       WHERE id = $1`,
      [business.id]
    );

    console.log('=== EMAIL VERIFIED ===');
    console.log('Business:', business.business_name);
    console.log('Email:', business.email);
    console.log('=====================');

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
}