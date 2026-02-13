import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(200).json({ success: true, staff: [] });
      }

      const branchId = branches[0].id;

      const staff = await query(
        'SELECT * FROM staff WHERE branch_id = $1 ORDER BY is_active DESC, full_name',
        [branchId]
      );

      return res.status(200).json({ success: true, staff });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fullName, phone, pinCode, hourlyRate, businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1 LIMIT 1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(400).json({ success: false, message: 'No branch found for this business' });
      }

      const branchId = branches[0].id;

      const newStaff = await querySingle(
        `INSERT INTO staff (branch_id, full_name, phone_number, pin_code, role, hourly_rate, is_active)
         VALUES ($1, $2, $3, $4, 'washer', $5, true)
         RETURNING *`,
        [branchId, fullName, phone, pinCode, hourlyRate || 0]
      );

      return res.status(201).json({ success: true, staff: newStaff });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { staffId, isActive } = req.body;

      await query(
        'UPDATE staff SET is_active = $1 WHERE id = $2',
        [isActive, staffId]
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}