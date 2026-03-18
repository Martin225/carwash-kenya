import { query } from '../../../lib/db';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      // Get all staff across all branches for this business
      const staff = await query(
        `SELECT 
          s.id,
          s.full_name,
          s.phone_number,
          s.commission_percentage,
          s.is_active,
          s.created_at,
          b.branch_name,
          b.id as branch_id
         FROM staff s
         LEFT JOIN branches b ON s.branch_id = b.id
         WHERE b.business_id = $1
         ORDER BY b.branch_name, s.full_name`,
        [businessId]
      );

      return res.status(200).json({ 
        success: true, 
        staff: staff || [],
        count: staff?.length || 0
      });

    } else if (method === 'PUT') {
      // Update staff (e.g., commission percentage, reassign branch)
      const { staffId, commissionPercentage, branchId, isActive } = req.body;

      if (!staffId) {
        return res.status(400).json({ success: false, message: 'Staff ID required' });
      }

      let updateFields = [];
      let updateValues = [];
      let paramIndex = 1;

      if (commissionPercentage !== undefined) {
        updateFields.push(`commission_percentage = $${paramIndex}`);
        updateValues.push(commissionPercentage);
        paramIndex++;
      }

      if (branchId !== undefined) {
        updateFields.push(`branch_id = $${paramIndex}`);
        updateValues.push(branchId);
        paramIndex++;
      }

      if (isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(isActive);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      updateValues.push(staffId);

      const result = await query(
        `UPDATE staff 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Staff not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Staff updated successfully',
        staff: result[0]
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}