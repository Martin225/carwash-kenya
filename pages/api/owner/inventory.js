import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, period = '30' } = req.query;

    if (!businessId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Business ID required' 
      });
    }

    // Get all branches for this business
    const branches = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    if (branches.length === 0) {
      return res.status(200).json({
        success: true,
        inventory: [],
        stats: {
          totalValue: 0,
          lowStockCount: 0,
          monthlyConsumption: 0,
          totalItems: 0
        }
      });
    }

    const branchIds = branches.map(b => b.id);

    // Get all inventory items with consumption data
    const inventory = await query(
      `SELECT 
        i.*,
        COALESCE(
          (SELECT SUM(quantity) 
           FROM inventory_transactions 
           WHERE item_id = i.id 
             AND transaction_type = 'use'
             AND created_at >= NOW() - INTERVAL '${parseInt(period)} days'
          ), 0
        ) as monthly_usage
      FROM inventory_items i
      WHERE i.branch_id = ANY($1)
      ORDER BY i.item_name ASC`,
      [branchIds]
    );

    // Calculate stats
    let totalValue = 0;
    let lowStockCount = 0;
    let monthlyConsumption = 0;

    inventory.forEach(item => {
      const currentStock = parseFloat(item.current_stock) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const reorderLevel = parseFloat(item.reorder_level) || 0;
      const usage = parseFloat(item.monthly_usage) || 0;

      // Total inventory value
      totalValue += (currentStock * unitCost);

      // Low stock count
      if (currentStock <= reorderLevel) {
        lowStockCount++;
      }

      // Monthly consumption value
      monthlyConsumption += (usage * unitCost);
    });

    const stats = {
      totalValue: Math.round(totalValue),
      lowStockCount,
      monthlyConsumption: Math.round(monthlyConsumption),
      totalItems: inventory.length
    };

    console.log('📦 Owner inventory loaded:', {
      items: inventory.length,
      totalValue: stats.totalValue,
      lowStock: stats.lowStockCount
    });

    return res.status(200).json({
      success: true,
      inventory,
      stats
    });

  } catch (error) {
    console.error('❌ Owner inventory API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}