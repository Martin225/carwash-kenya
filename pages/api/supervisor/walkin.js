import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { vehicleReg, phone, customerName, vehicleType, serviceId, bayId, staffId, businessId } = req.body;

    // Get branch
    const branches = await query('SELECT id FROM branches WHERE business_id = $1 LIMIT 1', [businessId]);
    if (branches.length === 0) {
      return res.status(400).json({ success: false, message: 'Branch not found' });
    }
    const branchId = branches[0].id;

    // Find or create customer
    let customer = await querySingle('SELECT * FROM customers WHERE phone_number = $1', [phone]);
    if (!customer) {
      customer = await querySingle(
        'INSERT INTO customers (phone_number, full_name, loyalty_points, total_visits) VALUES ($1, $2, 0, 0) RETURNING *',
        [phone, customerName || '']
      );
    }

    // Find or create vehicle
    let vehicle = await querySingle('SELECT * FROM vehicles WHERE registration_number = $1', [vehicleReg]);
    if (!vehicle) {
      vehicle = await querySingle(
        'INSERT INTO vehicles (customer_id, registration_number, vehicle_type) VALUES ($1, $2, $3) RETURNING *',
        [customer.id, vehicleReg, vehicleType]
      );
    }

    // Get service pricing
    const pricing = await querySingle(
      'SELECT base_price FROM service_pricing WHERE service_id = $1 AND vehicle_type = $2',
      [serviceId, vehicleType]
    );

    if (!pricing) {
      return res.status(400).json({ success: false, message: 'Service pricing not found' });
    }

    const finalAmount = pricing.base_price;

    // Generate queue number
    const todayCount = await query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE branch_id = $1 AND booking_date = CURRENT_DATE`,
      [branchId]
    );
    const queueNumber = (parseInt(todayCount[0].count) || 0) + 1;

    // Create booking (instant, no approval needed)
    const booking = await querySingle(
      `INSERT INTO bookings (
        branch_id, customer_id, vehicle_id, service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source,
        bay_id, assigned_staff_id,
        approved_at, approved_by
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_TIME, $5, $6, 'in-progress', 'unpaid', 'walkin', $7, $8, NOW(), $9)
      RETURNING *`,
      [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount, bayId, staffId, businessId]
    );

    // Update bay status
    await query(
      `UPDATE bays 
       SET status = 'occupied', 
           current_booking_id = $1,
           current_staff_id = $2
       WHERE id = $3`,
      [booking.id, staffId, bayId]
    );

    // Update customer stats
    const newTotalVisits = (customer.total_visits || 0) + 1;
    const newLoyaltyPoints = (customer.loyalty_points || 0) + 10;
    
    await query(
      `UPDATE customers 
       SET total_visits = $1, 
           loyalty_points = $2,
           last_visit_date = NOW()
       WHERE id = $3`,
      [newTotalVisits, newLoyaltyPoints, customer.id]
    );

    // Get bay number for response
    const bay = await querySingle('SELECT bay_number FROM bays WHERE id = $1', [bayId]);

    console.log('=== WALK-IN REGISTERED ===');
    console.log('Queue #:', queueNumber);
    console.log('Vehicle:', vehicleReg);
    console.log('Bay:', bay.bay_number);
    console.log('Amount:', finalAmount);
    console.log('========================');

    // TODO: Send SMS to customer
    // TODO: Notify assigned staff

    return res.status(201).json({
      success: true,
      queueNumber,
      bayNumber: bay.bay_number,
      amount: finalAmount,
      booking
    });
  } catch (error) {
    console.error('Walk-in error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}