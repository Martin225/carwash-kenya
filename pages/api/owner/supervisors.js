import bcrypt from 'bcryptjs';
import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;
      
      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const supervisors = await query(
        `SELECT u.*,
                b.branch_name,
                b.branch_code
         FROM users u
         LEFT JOIN branches b ON u.branch_id = b.id
         WHERE u.business_id = $1 AND u.role = 'supervisor'
         ORDER BY u.is_active DESC, u.full_name`,
        [businessId]
      );

      return res.status(200).json({ success: true, supervisors });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fullName, email, phone, password, branchId, businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const existing = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newSupervisor = await querySingle(
        `INSERT INTO users (business_id, full_name, email, phone, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, 'supervisor', $5, true)
         RETURNING *`,
        [businessId, fullName, email, phone, hashedPassword]
      );

      console.log('=== NEW SUPERVISOR ADDED ===');
      console.log('Name:', fullName);
      console.log('Email:', email);
      console.log('Business ID:', businessId);
      console.log('===========================');

      return res.status(201).json({ success: true, supervisor: newSupervisor });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { supervisorId, isActive } = req.body;

      await query(
        'UPDATE users SET is_active = $1 WHERE id = $2',
        [isActive, supervisorId]
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { supervisorId } = req.body;

      if (!supervisorId) {
        return res.status(400).json({ success: false, message: 'Supervisor ID required' });
      }

      // Delete supervisor permanently
      await query('DELETE FROM users WHERE id = $1 AND role = $2', [supervisorId, 'supervisor']);

      return res.status(200).json({
        success: true,
        message: 'Supervisor deleted permanently'
      });
    } catch (error) {
      console.error('Delete supervisor error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete supervisor'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}