import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { staffId, newBranchId } = req.body;

    if (!staffId || !newBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID and new branch ID required'
      });
    }

    await query(
      'UPDATE staff SET branch_id = $1 WHERE id = $2',
      [newBranchId, staffId]
    );

    console.log('✅ Reassigned staff:', staffId, 'to branch:', newBranchId);

    return res.status(200).json({
      success: true,
      message: 'Staff transferred successfully'
    });

  } catch (error) {
    console.error('Reassign staff error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}