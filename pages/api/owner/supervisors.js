import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const supervisors = await query(
        `SELECT * FROM users 
         WHERE business_id = $1 AND role = 'supervisor'
         ORDER BY is_active DESC, full_name`,
        [businessId]
      );

      return res.status(200).json({ success: true, supervisors });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fullName, email, phone, password, businessId } = req.body;

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

      const newSupervisor = await querySingle(
        `INSERT INTO users (business_id, full_name, email, phone, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, 'supervisor', $5, true)
         RETURNING *`,
        [businessId, fullName, email, phone, password]
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

  return res.status(405).json({ message: 'Method not allowed' });
}