import ExcelJS from 'exceljs';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { branchId, staffId, period, startDate, endDate } = req.query;

    if (!branchId) {
      return res.status(400).json({ message: 'Branch ID required' });
    }

    // Build filters (same as commission-reports-API.js)
    let dateFilter = '';
    let dateParams = [branchId];
    let paramIndex = 2;

    if (period === 'week') {
      dateFilter = `AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (period === 'last_month') {
      dateFilter = `AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                    AND b.created_at < DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = `AND b.created_at::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      dateParams.push(startDate, endDate);
      paramIndex += 2;
    }

    let staffFilter = '';
    if (staffId) {
      staffFilter = `AND s.id = $${paramIndex}`;
      dateParams.push(staffId);
    }

    // Get commission data
    const commissionsQuery = `
      WITH booking_staff_counts AS (
        SELECT 
          booking_id,
          COUNT(*) as staff_count
        FROM booking_staff
        GROUP BY booking_id
      )
      SELECT 
        s.full_name as staff_name,
        s.commission_percentage,
        b.created_at,
        b.final_amount,
        b.payment_status,
        COALESCE(v.registration_number, 'Walk-in') as vehicle_reg,
        COALESCE(v.vehicle_type, 'N/A') as vehicle_type,
        srv.service_name,
        c.full_name as customer_name,
        COALESCE(bsc.staff_count, 1) as staff_count,
        (b.final_amount * (s.commission_percentage / 100.0)) / COALESCE(bsc.staff_count, 1) as commission_earned
      FROM bookings b
      LEFT JOIN booking_staff bs ON b.id = bs.booking_id
      LEFT JOIN staff s ON bs.staff_id = s.id OR (bs.staff_id IS NULL AND b.assigned_staff_id = s.id)
      LEFT JOIN booking_staff_counts bsc ON b.id = bsc.booking_id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN services srv ON b.service_id = srv.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.branch_id = $1
        AND b.status = 'completed'
        ${dateFilter}
        ${staffFilter}
        AND s.id IS NOT NULL
      ORDER BY b.created_at DESC
    `;

    const commissions = await query(commissionsQuery, dateParams);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commission Report');

    // Add title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'Staff Commission Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add period info
    worksheet.mergeCells('A2:H2');
    const periodText = period === 'week' ? 'This Week' : 
                      period === 'month' ? 'This Month' : 
                      period === 'last_month' ? 'Last Month' : 
                      `${startDate} to ${endDate}`;
    worksheet.getCell('A2').value = `Period: ${periodText}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Add headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Date',
      'Staff Name',
      'Vehicle',
      'Type',
      'Service',
      'Staff Split',
      'Amount (Kshs)',
      'Commission (Kshs)',
      'Payment Status'
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006633' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    commissions.forEach(job => {
      worksheet.addRow([
        new Date(job.created_at).toLocaleDateString(),
        job.staff_name,
        job.vehicle_reg,
        job.vehicle_type,
        job.service_name,
        job.staff_count > 1 ? `1/${job.staff_count}` : 'Solo',
        parseFloat(job.final_amount).toFixed(2),
        parseFloat(job.commission_earned).toFixed(2),
        job.payment_status === 'paid' ? 'Paid' : 'Unpaid'
      ]);
    });

    // Add totals
    const totalRevenue = commissions.reduce((sum, c) => sum + parseFloat(c.final_amount || 0), 0);
    const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(c.commission_earned || 0), 0);

    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
      '', '', '', '', '', 'TOTAL:',
      totalRevenue.toFixed(2),
      totalCommission.toFixed(2),
      ''
    ]);
    totalRow.font = { bold: true };

    // Set column widths
    worksheet.columns = [
      { width: 12 }, // Date
      { width: 20 }, // Staff
      { width: 15 }, // Vehicle
      { width: 10 }, // Type
      { width: 25 }, // Service
      { width: 12 }, // Split
      { width: 15 }, // Amount
      { width: 18 }, // Commission
      { width: 15 }  // Payment
    ];

    // Generate filename
    const filename = `Commission_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Excel export error:', error);
    return res.status(500).json({ message: error.message });
  }
}