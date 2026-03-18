import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;
      
      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        `SELECT 
          b.*,
          (SELECT COUNT(*) FROM bays WHERE branch_id = b.id) as bay_count,
          (SELECT COUNT(*) FROM staff WHERE branch_id = b.id AND is_active = true) as staff_count,
          (SELECT COUNT(*) FROM users WHERE branch_id = b.id AND role = 'supervisor' AND is_active = true) as supervisor_count
         FROM branches b
         WHERE b.business_id = $1
         ORDER BY b.is_active DESC, b.branch_name`,
        [businessId]
      );

      return res.status(200).json({ success: true, branches });
    } catch (error) {
      console.error('Get branches error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { businessId, branchName, branchCode, address, city, numberOfBays } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      // Check if branch code already exists
      const existing = await query(
        'SELECT id FROM branches WHERE branch_code = $1 AND business_id = $2',
        [branchCode, businessId]
      );

      if (existing && existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Branch code already exists. Please use a unique code.'
        });
      }

      // Create branch
      const newBranch = await querySingle(
        `INSERT INTO branches (business_id, branch_name, branch_code, address, city, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING *`,
        [businessId, branchName, branchCode, address, city]
      );

      // Create bays for the branch
      const bayPromises = [];
      for (let i = 1; i <= numberOfBays; i++) {
        bayPromises.push(
          query(
            `INSERT INTO bays (branch_id, bay_number, status, created_at)
             VALUES ($1, $2, 'available', NOW())`,
            [newBranch.id, i]
          )
        );
      }
      await Promise.all(bayPromises);

      console.log('✅ New branch created:', branchName, 'with', numberOfBays, 'bays');

      return res.status(201).json({ success: true, branch: newBranch });
    } catch (error) {
      console.error('Create branch error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}