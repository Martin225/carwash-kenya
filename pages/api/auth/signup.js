import bcrypt from 'bcryptjs';
import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessName, ownerName, email, phone, password, location, numberOfBays } = req.body;

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const existingBusiness = await query(
      'SELECT id FROM businesses WHERE email = $1',
      [email]
    );

    if (existingBusiness && existingBusiness.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Business already registered with this email'
      });
    }

    // Create business
    const business = await querySingle(
  `INSERT INTO businesses (business_name, owner_name, email, phone, location, subscription_status, is_active)
   VALUES ($1, $2, $3, $4, $5, 'trial', false)
   RETURNING id`,
  [businessName, ownerName, email, phone, location]
);

    const businessId = business.id;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create owner user
    const owner = await querySingle(
      `INSERT INTO users (business_id, full_name, email, phone, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, 'owner', $5, false)
       RETURNING id`,
      [businessId, ownerName, email, phone, hashedPassword]
    );
console.log('=== NEW BUSINESS SIGNUP ===');
    console.log('Business:', businessName);
    console.log('Owner:', ownerName);
    console.log('Email:', email);
    console.log('Bays:', numberOfBays);
    console.log('==========================');

    // Send verification email
    console.log('📧 About to send verification email...');
    console.log('URL:', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-verification-email`);
    
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId,
          ownerName: ownerName,
          businessName: businessName,
          email: email
        })
      });
      
      const emailData = await emailResponse.json();
      console.log('📧 Email API response:', emailData);
      
      if (!emailData.success) {
        console.error('📧 Email sending failed:', emailData.message);
      } else {
        console.log('✅ Email sent successfully!');
      }
    } catch (emailError) {
      console.error('📧 Failed to send verification email:', emailError);
      // Don't fail signup if email fails - admin can resend later
    }

    return res.status(201).json({
      success: true,
      message: 'Business registered successfully! Please check your email to verify your account.',
      businessId: businessId
    });
   
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    });
  }
}