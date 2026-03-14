import { query } from '../../../lib/db';
import ExcelJS from 'exceljs';

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

    // Get business details
    const business = await query(
      'SELECT business_name FROM businesses WHERE id = $1',
      [businessId]
    );

    if (business.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found' 
      });
    }

    const businessName = business[0].business_name;

    // Get all branches
    const branches = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    if (branches.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No branches found'
      });
    }

    const branchIds = branches.map(b => b.id);

    // Get inventory with consumption data
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
        ) as period_usage,
        COALESCE(
          (SELECT SUM(quantity) 
           FROM inventory_transactions 
           WHERE item_id = i.id 
             AND transaction_type = 'receive'
             AND created_at >= NOW() - INTERVAL '${parseInt(period)} days'
          ), 0
        ) as period_received
      FROM inventory_items i
      WHERE i.branch_id = ANY($1)
      ORDER BY i.category, i.item_name ASC`,
      [branchIds]
    );

    // Get transactions for the period
    const transactions = await query(
      `SELECT 
        it.*,
        i.item_name,
        i.category,
        i.unit,
        s.full_name as staff_name
      FROM inventory_transactions it
      JOIN inventory_items i ON it.item_id = i.id
      LEFT JOIN staff s ON it.staff_id = s.id
      WHERE i.branch_id = ANY($1)
        AND it.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
      ORDER BY it.created_at DESC`,
      [branchIds]
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = businessName;
    workbook.created = new Date();

    // SHEET 1: SUMMARY
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    let totalValue = 0;
    let lowStockCount = 0;
    let totalUsage = 0;
    let totalReceived = 0;

    inventory.forEach(item => {
      const currentStock = parseFloat(item.current_stock) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const reorderLevel = parseFloat(item.reorder_level) || 0;
      const usage = parseFloat(item.period_usage) || 0;
      const received = parseFloat(item.period_received) || 0;

      totalValue += (currentStock * unitCost);
      if (currentStock <= reorderLevel) lowStockCount++;
      totalUsage += (usage * unitCost);
      totalReceived += (received * unitCost);
    });

    summarySheet.addRows([
      { metric: 'Business Name', value: businessName },
      { metric: 'Report Period', value: `Last ${period} days` },
      { metric: 'Generated On', value: new Date().toLocaleString() },
      { metric: '', value: '' },
      { metric: 'Total Inventory Items', value: inventory.length },
      { metric: 'Total Inventory Value', value: `Kshs ${totalValue.toLocaleString()}` },
      { metric: 'Low Stock Items', value: lowStockCount },
      { metric: '', value: '' },
      { metric: `Stock Received (${period} days)`, value: `Kshs ${totalReceived.toLocaleString()}` },
      { metric: `Stock Used (${period} days)`, value: `Kshs ${totalUsage.toLocaleString()}` },
    ]);

    // Style summary
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getColumn('metric').font = { bold: true };

    // SHEET 2: CURRENT INVENTORY
    const inventorySheet = workbook.addWorksheet('Current Stock');
    
    inventorySheet.columns = [
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Item Name', key: 'item_name', width: 25 },
      { header: 'Current Stock', key: 'current_stock', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Reorder Level', key: 'reorder_level', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Unit Cost', key: 'unit_cost', width: 15 },
      { header: 'Total Value', key: 'total_value', width: 15 },
      { header: `Used (${period}d)`, key: 'period_usage', width: 15 },
      { header: `Received (${period}d)`, key: 'period_received', width: 15 }
    ];

    inventory.forEach(item => {
      const currentStock = parseFloat(item.current_stock) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const reorderLevel = parseFloat(item.reorder_level) || 0;
      const totalValue = currentStock * unitCost;
      
      let status = 'OK';
      if (currentStock <= reorderLevel) status = 'LOW';
      else if (currentStock <= reorderLevel * 1.5) status = 'NEAR';

      inventorySheet.addRow({
        category: item.category || 'General',
        item_name: item.item_name,
        current_stock: currentStock,
        unit: item.unit,
        reorder_level: reorderLevel,
        status: status,
        unit_cost: unitCost,
        total_value: totalValue,
        period_usage: parseFloat(item.period_usage) || 0,
        period_received: parseFloat(item.period_received) || 0
      });
    });

    // Style inventory sheet
    inventorySheet.getRow(1).font = { bold: true };
    inventorySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006633' }
    };
    inventorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // SHEET 3: TRANSACTIONS
    const transactionsSheet = workbook.addWorksheet('Transactions');
    
    transactionsSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Item', key: 'item_name', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Type', key: 'transaction_type', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Staff', key: 'staff_name', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    transactions.forEach(txn => {
      transactionsSheet.addRow({
        date: new Date(txn.created_at).toLocaleString(),
        item_name: txn.item_name,
        category: txn.category || 'General',
        transaction_type: txn.transaction_type.toUpperCase(),
        quantity: parseFloat(txn.quantity) || 0,
        unit: txn.unit,
        staff_name: txn.staff_name || 'N/A',
        notes: txn.notes || ''
      });
    });

    // Style transactions sheet
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006633' }
    };
    transactionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // SHEET 4: LOW STOCK ALERTS
    const lowStockSheet = workbook.addWorksheet('Low Stock Alerts');
    
    lowStockSheet.columns = [
      { header: 'Item Name', key: 'item_name', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Current Stock', key: 'current_stock', width: 15 },
      { header: 'Reorder Level', key: 'reorder_level', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Needed', key: 'needed', width: 15 }
    ];

    inventory
      .filter(item => parseFloat(item.current_stock) <= parseFloat(item.reorder_level))
      .forEach(item => {
        const currentStock = parseFloat(item.current_stock) || 0;
        const reorderLevel = parseFloat(item.reorder_level) || 0;
        const needed = Math.max(0, reorderLevel - currentStock);

        lowStockSheet.addRow({
          item_name: item.item_name,
          category: item.category || 'General',
          current_stock: currentStock,
          reorder_level: reorderLevel,
          unit: item.unit,
          needed: needed
        });
      });

    // Style low stock sheet
    lowStockSheet.getRow(1).font = { bold: true };
    lowStockSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF44336' }
    };
    lowStockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers
    const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    console.error('❌ Inventory report error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}