import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  // GET - Fetch branch details with supervisors and staff
  if (req.method === 'GET') {
    try {
      const { branchId } = req.query;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID required' });
      }

      // Get branch info
      const branch = await querySingle(
        `SELECT b.*,
                (SELECT COUNT(*) FROM bays WHERE branch_id = b.id) as bay_count
         FROM branches b
         WHERE b.id = $1`,
        [branchId]
      );

      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      // Get supervisors assigned to this branch
      const supervisors = await query(
        `SELECT id, full_name, email, phone, is_active, branch_id
         FROM users
         WHERE role = 'supervisor' AND branch_id = $1
         ORDER BY full_name`,
        [branchId]
      );

      // Get staff assigned to this branch
      const staff = await query(
        `SELECT s.*, b.branch_name
         FROM staff s
         LEFT JOIN branches b ON s.branch_id = b.id
         WHERE s.branch_id = $1
         ORDER BY s.is_active DESC, s.full_name`,
        [branchId]
      );

      return res.status(200).json({
        success: true,
        branch,
        supervisors,
        staff
      });

    } catch (error) {
      console.error('Get branch details error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT - Update branch information
  if (req.method === 'PUT') {
    try {
      const { branchId, branchName, branchCode, address, city, isActive } = req.body;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID required' });
      }

      await query(
        `UPDATE branches
         SET branch_name = $1,
             branch_code = $2,
             address = $3,
             city = $4,
             is_active = $5,
             updated_at = NOW()
         WHERE id = $6`,
        [branchName, branchCode, address, city, isActive, branchId]
      );

      console.log('✅ Branch updated:', branchName);

      return res.status(200).json({ success: true, message: 'Branch updated successfully' });

    } catch (error) {
      console.error('Update branch error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE - Delete branch
  if (req.method === 'DELETE') {
    try {
      const { branchId } = req.body;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID required' });
      }

      // Check if branch has active bookings
      const activeBookings = await query(
        `SELECT COUNT(*) as count
         FROM bookings
         WHERE branch_id = $1
         AND status IN ('pending', 'in-progress')`,
        [branchId]
      );

      if (parseInt(activeBookings[0]?.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete branch with active bookings. Complete or cancel all bookings first.'
        });
      }

      // Unassign staff and supervisors
      await query('UPDATE staff SET branch_id = NULL WHERE branch_id = $1', [branchId]);
      await query('UPDATE users SET branch_id = NULL WHERE branch_id = $1', [branchId]);

      // Delete branch
      await query('DELETE FROM branches WHERE id = $1', [branchId]);

      console.log('❌ Branch deleted:', branchId);

      return res.status(200).json({ success: true, message: 'Branch deleted successfully' });

    } catch (error) {
      console.error('Delete branch error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}