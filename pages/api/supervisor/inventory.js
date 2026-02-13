import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query('SELECT id FROM branches WHERE business_id = $1', [businessId]);
      if (branches.length === 0) {
        return res.status(200).json({ success: true, inventory: [] });
      }

      const branchIds = branches.map(b => b.id);

      const inventory = await query(
        `SELECT * FROM inventory_items
         WHERE branch_id = ANY($1)
         ORDER BY 
           CASE WHEN current_stock <= reorder_level THEN 0 ELSE 1 END,
           current_stock ASC`,
        [branchIds]
      );

      return res.status(200).json({ success: true, inventory });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { itemId, quantity, action, businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const item = await querySingle('SELECT * FROM inventory_items WHERE id = $1', [itemId]);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      let newStock;
      if (action === 'add') {
        newStock = item.current_stock + parseInt(quantity);
      } else {
        newStock = item.current_stock - parseInt(quantity);
        if (newStock < 0) {
          return res.status(400).json({ success: false, message: 'Not enough stock' });
        }
      }

      await query(
        'UPDATE inventory_items SET current_stock = $1 WHERE id = $2',
        [newStock, itemId]
      );

      return res.status(200).json({ success: true, newStock });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}