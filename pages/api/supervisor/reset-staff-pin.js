import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { sendSMS } from '../../../lib/sms';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { staffId, newPin, staffPhone, staffName } = req.body;

    if (!staffId || !newPin || !staffPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update staff PIN in database
    await query(
      'UPDATE staff SET pin_code = $1 WHERE id = $2',
      [hashedPin, staffId]
    );

    console.log('=== PIN RESET ===');
    console.log('Staff:', staffName);
    console.log('Phone:', staffPhone);
    console.log('New PIN:', newPin);
    console.log('=================');

    // Send SMS with new PIN
    const smsMessage = `Hello ${staffName},

Your PIN has been reset by your supervisor.

New PIN: ${newPin}

Please use this PIN to login to the CarWash system.

- Management`;

    const smsResult = await sendSMS(staffPhone, smsMessage);

    if (smsResult.success) {
      console.log('✅ PIN reset SMS sent successfully!');
    } else {
      console.error('❌ SMS failed:', smsResult.error);
    }

    return res.status(200).json({
      success: true,
      message: smsResult.success 
        ? 'PIN reset successfully! SMS sent to staff.' 
        : 'PIN reset but SMS failed to send.',
      newPin: newPin // For testing only - remove in production
    });

  } catch (error) {
    console.error('Reset PIN error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset PIN: ' + error.message
    });
  }
}