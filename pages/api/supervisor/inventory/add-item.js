import { query, querySingle } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { itemName, category, unit, currentStock, reorderLevel, businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    const branches = await query('SELECT id FROM branches WHERE business_id = $1 LIMIT 1', [businessId]);
    if (branches.length === 0) {
      return res.status(400).json({ success: false, message: 'No branch found' });
    }

    const branchId = branches[0].id;

    const newItem = await querySingle(
      `INSERT INTO inventory_items (
        branch_id, 
        item_name, 
        category, 
        unit, 
        current_stock, 
        reorder_level
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [branchId, itemName, category, unit, parseFloat(currentStock), parseFloat(reorderLevel)]
    );

    console.log('=== NEW INVENTORY ITEM ===');
    console.log('Item:', itemName);
    console.log('Stock:', currentStock, unit);
    console.log('=========================');

    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('Add item error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}