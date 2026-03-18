import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { branchId, supervisorId, oldSupervisorId } = req.body;

    // Remove old supervisor from branch
    if (oldSupervisorId) {
      await query(
        'UPDATE users SET branch_id = NULL WHERE id = $1',
        [oldSupervisorId]
      );
      console.log('🔓 Unassigned supervisor:', oldSupervisorId);
    }

    // Assign new supervisor to branch
    if (supervisorId) {
      await query(
        'UPDATE users SET branch_id = $1 WHERE id = $2',
        [branchId, supervisorId]
      );
      console.log('✅ Assigned supervisor:', supervisorId, 'to branch:', branchId);
    }

    return res.status(200).json({
      success: true,
      message: supervisorId ? 'Supervisor reassigned successfully' : 'Supervisor removed from branch'
    });

  } catch (error) {
    console.error('Reassign supervisor error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}