import ExcelJS from 'exceljs';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, period, startDate, endDate } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    // Calculate date range based on period
    let dateFilter = '';
    let reportTitle = '';
    const today = new Date();
    
    if (period === 'daily') {
      dateFilter = `DATE(b.created_at) = CURRENT_DATE`;
      reportTitle = `Daily Report - ${today.toLocaleDateString('en-KE')}`;
    } else if (period === 'weekly') {
      dateFilter = `DATE(b.created_at) >= CURRENT_DATE - INTERVAL '7 days'`;
      reportTitle = `Weekly Report - Last 7 Days`;
    } else if (period === 'monthly') {
      dateFilter = `DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
      reportTitle = `Monthly Report - ${today.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`;
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = `DATE(b.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      reportTitle = `Custom Report - ${startDate} to ${endDate}`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid period or date range' });
    }

    // Get business info
    const businessInfo = await query(
      'SELECT business_name, owner_name, email, phone FROM businesses WHERE id = $1',
      [businessId]
    );

    if (businessInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const business = businessInfo[0];

    // Get bookings data
    const bookings = await query(`
      SELECT 
        b.id,
        b.booking_code,
        b.created_at,
        b.booking_date,
        b.booking_time,
        COALESCE(v.registration_number, 'Walk-in') as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        s.service_name,
        b.final_amount,
        b.payment_status,
        b.payment_method,
        b.payment_reference,
        st.full_name as staff_name,
        st.commission_per_car,
        br.branch_name,
        b.status
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN staff st ON b.assigned_staff_id = st.id
      JOIN branches br ON b.branch_id = br.id
      WHERE br.business_id = $1
        AND ${dateFilter}
      ORDER BY b.created_at DESC
    `, [businessId]);

    // Get expenses data
    const expenses = await query(`
      SELECT 
        expense_date,
        category,
        description,
        amount,
        payment_method
      FROM expenses
      WHERE business_id = $1
        AND ${dateFilter.replace('b.created_at', 'expense_date')}
      ORDER BY expense_date DESC
    `, [businessId]);

    // Calculate summary
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

    const totalStaffCommissions = bookings
      .filter(b => b.payment_status === 'paid' && b.commission_per_car)
      .reduce((sum, b) => sum + parseFloat(b.commission_per_car || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const totalCosts = totalStaffCommissions + totalExpenses;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(2) : 0;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // SHEET 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Header styling
    summarySheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006633' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Business info
    summarySheet.addRow({ metric: 'Business Name', value: business.business_name });
    summarySheet.addRow({ metric: 'Owner', value: business.owner_name });
    summarySheet.addRow({ metric: 'Report Period', value: reportTitle });
    summarySheet.addRow({ metric: 'Generated On', value: new Date().toLocaleString('en-KE') });
    summarySheet.addRow({});

    // Financial Summary
    summarySheet.addRow({ metric: 'FINANCIAL SUMMARY', value: '' }).font = { bold: true, size: 12 };
    summarySheet.addRow({ metric: 'Total Bookings', value: bookings.length });
    summarySheet.addRow({ metric: 'Completed Bookings', value: bookings.filter(b => b.status === 'completed').length });
    summarySheet.addRow({ metric: 'Paid Bookings', value: bookings.filter(b => b.payment_status === 'paid').length });
    summarySheet.addRow({});
    
    summarySheet.addRow({ metric: 'Total Revenue', value: `Kshs ${totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` }).font = { bold: true, color: { argb: 'FF006633' } };
    summarySheet.addRow({ metric: 'Staff Commissions', value: `Kshs ${totalStaffCommissions.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` });
    summarySheet.addRow({ metric: 'Operating Expenses', value: `Kshs ${totalExpenses.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` });
    summarySheet.addRow({ metric: 'Total Costs', value: `Kshs ${totalCosts.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` }).font = { bold: true };
    summarySheet.addRow({});
    
    summarySheet.addRow({ metric: 'NET PROFIT', value: `Kshs ${netProfit.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` }).font = { bold: true, size: 14, color: { argb: netProfit >= 0 ? 'FF006633' : 'FFF44336' } };
    summarySheet.addRow({ metric: 'Profit Margin', value: `${profitMargin}%` });
    summarySheet.addRow({ metric: 'ROI', value: `${roi}%` });

    // SHEET 2: Bookings
    const bookingsSheet = workbook.addWorksheet('Bookings');
    
    bookingsSheet.columns = [
      { header: 'Booking Code', key: 'code', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Vehicle', key: 'vehicle', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Service', key: 'service', width: 20 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Payment Status', key: 'payment', width: 12 },
      { header: 'Method', key: 'method', width: 12 },
      { header: 'Reference', key: 'reference', width: 15 },
      { header: 'Staff', key: 'staff', width: 20 },
      { header: 'Commission', key: 'commission', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    bookingsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    bookingsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006633' } };
    bookingsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    bookings.forEach(booking => {
      bookingsSheet.addRow({
        code: booking.booking_code,
        date: new Date(booking.booking_date).toLocaleDateString('en-KE'),
        time: booking.booking_time,
        vehicle: booking.vehicle_reg,
        customer: booking.customer_name,
        phone: booking.customer_phone,
        service: booking.service_name,
        amount: parseFloat(booking.final_amount).toFixed(2),
        payment: booking.payment_status,
        method: booking.payment_method || '-',
        reference: booking.payment_reference || '-',
        staff: booking.staff_name || '-',
        commission: booking.commission_per_car ? parseFloat(booking.commission_per_car).toFixed(2) : '0.00',
        status: booking.status
      });
    });

    // SHEET 3: Expenses
    if (expenses.length > 0) {
      const expensesSheet = workbook.addWorksheet('Expenses');
      
      expensesSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Payment Method', key: 'method', width: 15 }
      ];

      expensesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      expensesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006633' } };
      expensesSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      expenses.forEach(expense => {
        expensesSheet.addRow({
          date: new Date(expense.expense_date).toLocaleDateString('en-KE'),
          category: expense.category,
          description: expense.description || '-',
          amount: parseFloat(expense.amount).toFixed(2),
          method: expense.payment_method || '-'
        });
      });
    }

    // SHEET 4: Service Breakdown
    const serviceBreakdown = {};
    bookings.filter(b => b.payment_status === 'paid').forEach(booking => {
      if (!serviceBreakdown[booking.service_name]) {
        serviceBreakdown[booking.service_name] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[booking.service_name].count++;
      serviceBreakdown[booking.service_name].revenue += parseFloat(booking.final_amount);
    });

    const servicesSheet = workbook.addWorksheet('Services Breakdown');
    servicesSheet.columns = [
      { header: 'Service', key: 'service', width: 30 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Avg per Service', key: 'avg', width: 15 }
    ];

    servicesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    servicesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006633' } };
    servicesSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    Object.entries(serviceBreakdown).forEach(([service, data]) => {
      servicesSheet.addRow({
        service,
        count: data.count,
        revenue: data.revenue.toFixed(2),
        avg: (data.revenue / data.count).toFixed(2)
      });
    });

    // SHEET 5: Staff Performance
    const staffPerformance = {};
    bookings.filter(b => b.payment_status === 'paid' && b.staff_name).forEach(booking => {
      if (!staffPerformance[booking.staff_name]) {
        staffPerformance[booking.staff_name] = { 
          count: 0, 
          revenue: 0, 
          commission: 0 
        };
      }
      staffPerformance[booking.staff_name].count++;
      staffPerformance[booking.staff_name].revenue += parseFloat(booking.final_amount);
      staffPerformance[booking.staff_name].commission += parseFloat(booking.commission_per_car || 0);
    });

    const staffSheet = workbook.addWorksheet('Staff Performance');
    staffSheet.columns = [
      { header: 'Staff Name', key: 'staff', width: 25 },
      { header: 'Cars Washed', key: 'count', width: 15 },
      { header: 'Revenue Generated', key: 'revenue', width: 18 },
      { header: 'Total Commission', key: 'commission', width: 18 }
    ];

    staffSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    staffSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006633' } };
    staffSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    Object.entries(staffPerformance).forEach(([staff, data]) => {
      staffSheet.addRow({
        staff,
        count: data.count,
        revenue: data.revenue.toFixed(2),
        commission: data.commission.toFixed(2)
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${reportTitle.replace(/\s+/g, '_')}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report: ' + error.message
    });
  }
}