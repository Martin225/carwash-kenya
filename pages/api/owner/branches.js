import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(`
        SELECT 
          b.*,
          COUNT(DISTINCT bay.id) as bay_count,
          COUNT(DISTINCT s.id) as staff_count,
          COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'supervisor') as supervisor_count
        FROM branches b
        LEFT JOIN bays bay ON b.id = bay.branch_id
        LEFT JOIN staff s ON b.id = s.branch_id
        LEFT JOIN users u ON u.business_id = b.business_id
        WHERE b.business_id = $1
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `, [businessId]);

      return res.status(200).json({ success: true, branches });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { branchName, branchCode, address, city, numberOfBays, businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const existingCode = await query(
        'SELECT id FROM branches WHERE branch_code = $1',
        [branchCode]
      );

      if (existingCode.length > 0) {
        return res.status(400).json({ success: false, message: 'Branch code already exists' });
      }

      const newBranch = await querySingle(`
        INSERT INTO branches (business_id, branch_name, branch_code, address, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id
      `, [businessId, branchName, branchCode, `${address}, ${city}`]);

      for (let i = 1; i <= numberOfBays; i++) {
        await query(`
          INSERT INTO bays (branch_id, bay_number, bay_name, status, is_active)
          VALUES ($1, $2, $3, 'available', true)
        `, [newBranch.id, i, `Bay ${i}`]);
      }

      console.log('=== NEW BRANCH ADDED ===');
      console.log('Branch:', branchName);
      console.log('Code:', branchCode);
      console.log('Bays:', numberOfBays);
      console.log('=======================');

      return res.status(201).json({ success: true, branch: newBranch });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}