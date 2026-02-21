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
      const { itemId, quantity, action, businessId, userId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const item = await querySingle('SELECT * FROM inventory_items WHERE id = $1', [itemId]);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      // ✅ FIX: Convert to numbers properly!
      const currentStock = parseFloat(item.current_stock) || 0;
      const quantityToChange = parseFloat(quantity) || 0;

      let newStock;
      let transactionType;
      
      if (action === 'add') {
        // Receiving stock
        newStock = currentStock + quantityToChange;
        transactionType = 'receive';
        console.log(`📦 RECEIVING: ${currentStock} + ${quantityToChange} = ${newStock}`);
      } else {
        // Using stock
        newStock = currentStock - quantityToChange;
        transactionType = 'use';
        console.log(`📤 USING: ${currentStock} - ${quantityToChange} = ${newStock}`);
        
        if (newStock < 0) {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough stock. Current: ${currentStock}, Requested: ${quantityToChange}` 
          });
        }
      }

      // Update stock
      await query(
        'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, itemId]
      );

      // ✅ Log transaction with CORRECT column names
      await query(
        `INSERT INTO inventory_transactions (
          item_id, 
          transaction_type, 
          quantity, 
          notes,
          staff_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          itemId, 
          transactionType, 
          quantityToChange, 
          `${action === 'add' ? 'Received' : 'Used'} ${quantityToChange} ${item.unit}. Stock: ${currentStock} → ${newStock}`,
          userId || null
        ]
      );

      console.log(`✅ Stock updated: ${item.item_name} - ${currentStock} → ${newStock} ${item.unit}`);

      return res.status(200).json({ 
        success: true, 
        newStock,
        message: `${action === 'add' ? 'Received' : 'Used'} ${quantityToChange} ${item.unit}. New stock: ${newStock} ${item.unit}`
      });

    } catch (error) {
      console.error('Inventory update error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}