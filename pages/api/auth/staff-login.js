import { querySingle } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, pin } = req.body;

    const staff = await querySingle(
  `SELECT s.*, b.business_id, b.branch_name, bus.business_name
   FROM staff s
   JOIN branches b ON s.branch_id = b.id
   JOIN businesses bus ON b.business_id = bus.id
   WHERE s.phone_number = $1 AND s.is_active = true`,
  [phone]
);

if (!staff) {
  return res.status(401).json({
    success: false,
    message: 'Invalid phone number or PIN'
  });
}

// Check if PIN is hashed
let pinMatch = false;

if (staff.pin_code.startsWith('$2a$') || staff.pin_code.startsWith('$2b$')) {
  // Hashed PIN - use bcrypt
  pinMatch = await bcrypt.compare(pin, staff.pin_code);
} else {
  // Plain text PIN - direct comparison
  pinMatch = (pin === staff.pin_code);
}

if (!pinMatch) {
  return res.status(401).json({
    success: false,
    message: 'Invalid phone number or PIN'
  });
}

    const userData = {
      id: staff.id,
      full_name: staff.full_name,
      phone: staff.phone_number,
      role: 'staff',
      business_id: staff.business_id,
      branch_id: staff.branch_id,
      business_name: staff.business_name,
      branch_name: staff.branch_name
    };

    console.log('=== STAFF LOGIN ===');
    console.log('Name:', staff.full_name);
    console.log('Phone:', phone);
    console.log('Branch:', staff.branch_name);
    console.log('==================');

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