import PDFDocument from 'pdfkit';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID required' });
    }

    // Get booking details with all related information
    const bookings = await query(
      `SELECT 
        b.id,
        b.final_amount,
        b.payment_method,
        b.payment_reference,
        b.paid_at,
        b.created_at,
        COALESCE(v.registration_number, 'Walk-in Service') as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        s.service_name,
        staff.full_name as staff_name,
        bay.bay_number,
        br.branch_name,
        bus.business_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       JOIN services s ON b.service_id = s.id
       LEFT JOIN staff ON b.assigned_staff_id = staff.id
       LEFT JOIN bays bay ON b.bay_id = bay.id
       JOIN branches br ON b.branch_id = br.id
       JOIN businesses bus ON br.business_id = bus.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Generate receipt number
    const receiptNumber = `RCP-${String(booking.id).padStart(6, '0')}`;

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptNumber}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Draw header border
    doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
       .lineWidth(2)
       .stroke('#006633');

    // Business Name (Header)
    doc.fontSize(24)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text(booking.business_name, 0, 80, { align: 'center' });

    // Separator line
    doc.moveTo(100, 120)
       .lineTo(doc.page.width - 100, 120)
       .lineWidth(1)
       .stroke('#006633');

    // Receipt Title
    doc.fontSize(18)
       .fillColor('#333333')
       .text('TAX INVOICE / RECEIPT', 0, 140, { align: 'center' });

    // Another separator
    doc.moveTo(100, 170)
       .lineTo(doc.page.width - 100, 170)
       .lineWidth(1)
       .stroke('#006633');

    let yPos = 200;

    // Receipt Number & Date
    doc.fontSize(12)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Receipt #:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(receiptNumber, { align: 'left' });

    doc.fillColor('#666666')
       .font('Helvetica')
       .text('Date:', 350, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(new Date(booking.paid_at).toLocaleString('en-KE', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       }), { align: 'left' });

    yPos += 40;

    // Section: Customer & Vehicle Details
    doc.fontSize(14)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text('CUSTOMER DETAILS', 100, yPos);

    yPos += 25;

    // Vehicle
    doc.fontSize(11)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Vehicle:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${booking.vehicle_reg}`, { align: 'left' });

    yPos += 20;

    // Customer Name
    doc.fillColor('#666666')
       .font('Helvetica')
       .text('Customer:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${booking.customer_name}`, { align: 'left' });

    yPos += 20;

    // Phone
    doc.fillColor('#666666')
       .font('Helvetica')
       .text('Phone:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${booking.customer_phone}`, { align: 'left' });

    yPos += 40;

    // Section: Service Details
    doc.fontSize(14)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text('SERVICE DETAILS', 100, yPos);

    yPos += 25;

    // Service
    doc.fontSize(11)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Service:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${booking.service_name}`, { align: 'left' });

    yPos += 20;

    // Staff
    if (booking.staff_name) {
      doc.fillColor('#666666')
         .font('Helvetica')
         .text('Attended by:', 100, yPos, { continued: true })
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(` ${booking.staff_name}`, { align: 'left' });

      yPos += 20;
    }

    // Bay
    if (booking.bay_number) {
      doc.fillColor('#666666')
         .font('Helvetica')
         .text('Bay:', 100, yPos, { continued: true })
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(` ${booking.bay_number}`, { align: 'left' });

      yPos += 20;
    }

    // Branch
    doc.fillColor('#666666')
       .font('Helvetica')
       .text('Branch:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${booking.branch_name}`, { align: 'left' });

    yPos += 40;

    // Section: Payment Details
    doc.fontSize(14)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text('PAYMENT DETAILS', 100, yPos);

    yPos += 25;

    // Payment Method
    const paymentMethodMap = {
      'mpesa_till': 'M-Pesa Till',
      'mpesa_paybill': 'M-Pesa Paybill',
      'bank': 'Bank Transfer',
      'cash': 'Cash'
    };

    doc.fontSize(11)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Payment Method:', 100, yPos, { continued: true })
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(` ${paymentMethodMap[booking.payment_method] || booking.payment_method}`, { align: 'left' });

    yPos += 20;

    // Reference
    if (booking.payment_reference) {
      doc.fillColor('#666666')
         .font('Helvetica')
         .text('Reference:', 100, yPos, { continued: true })
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(` ${booking.payment_reference}`, { align: 'left' });

      yPos += 20;
    }

    yPos += 20;

    // Amount Box (Highlighted)
    doc.rect(100, yPos, doc.page.width - 200, 50)
       .fillAndStroke('#e8f5e9', '#006633');

    doc.fontSize(16)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text('AMOUNT PAID:', 120, yPos + 17, { continued: true })
       .fontSize(18)
       .text(` Kshs ${parseFloat(booking.final_amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, { align: 'left' });

    yPos += 80;

    // Footer separator
    doc.moveTo(100, doc.page.height - 150)
       .lineTo(doc.page.width - 100, doc.page.height - 150)
       .lineWidth(1)
       .stroke('#006633');

    // Thank you message
    doc.fontSize(14)
       .fillColor('#006633')
       .font('Helvetica-Bold')
       .text('Thank you for choosing us!', 0, doc.page.height - 130, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#666666')
       .font('Helvetica')
       .text('We look forward to serving you again! 🚗✨', 0, doc.page.height - 110, { align: 'center' });

    // Footer text
    doc.fontSize(9)
       .fillColor('#999999')
       .text('Powered by Nats Automations Ltd', 0, doc.page.height - 70, { align: 'center' });

    doc.fontSize(8)
       .text('www.natsautomations.com', 0, doc.page.height - 55, { align: 'center' });

    // Finalize PDF
    doc.end();

    console.log('=== PDF RECEIPT GENERATED ===');
    console.log('Receipt #:', receiptNumber);
    console.log('Booking ID:', bookingId);
    console.log('Customer:', booking.customer_name);
    console.log('Amount:', booking.final_amount);
    console.log('=============================');

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate receipt: ' + error.message
    });
  }
}