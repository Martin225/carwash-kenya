import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { vehicleReg, phone, customerName, vehicleType, serviceId, bayId, staffId, businessId } = req.body;

    console.log('=== WALK-IN REGISTRATION START ===');
    console.log('Vehicle:', vehicleReg);
    console.log('Phone:', phone);
    console.log('Customer:', customerName);
    console.log('Business ID:', businessId);
    console.log('==================================');

    // Validate required fields
    if (!vehicleReg || !phone || !serviceId || !businessId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get branch
    const branches = await query(
      'SELECT id FROM branches WHERE business_id = $1 AND is_active = true LIMIT 1', 
      [businessId]
    );
    
    if (branches.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active branch found for this business' 
      });
    }
    
    const branchId = branches[0].id;
    console.log('Branch ID:', branchId);

    // Find or create customer (try both column names for compatibility)
    let customer;
    try {
      customer = await querySingle(
        'SELECT * FROM customers WHERE phone = $1 OR phone_number = $1',
        [phone]
      );
    } catch (e) {
      customer = null;
    }

    if (!customer) {
      console.log('Creating new customer...');
      try {
        // Try with 'phone' column first
        customer = await querySingle(
          'INSERT INTO customers (business_id, phone, full_name, loyalty_points, total_visits, created_at) VALUES ($1, $2, $3, 0, 0, NOW()) RETURNING *',
          [businessId, phone, customerName || 'Walk-in Customer']
        );
      } catch (phoneError) {
        // Fallback to 'phone_number' if 'phone' doesn't exist
        console.log('Trying phone_number column...');
        customer = await querySingle(
          'INSERT INTO customers (business_id, phone_number, full_name, loyalty_points, total_visits, created_at) VALUES ($1, $2, $3, 0, 0, NOW()) RETURNING *',
          [businessId, phone, customerName || 'Walk-in Customer']
        );
      }
      console.log('Customer created:', customer.id);
    } else {
      console.log('Existing customer found:', customer.id);
    }

    // Find or create vehicle
    let vehicle = await querySingle(
      'SELECT * FROM vehicles WHERE registration_number = $1 AND customer_id = $2',
      [vehicleReg, customer.id]
    );

    if (!vehicle) {
      console.log('Creating new vehicle...');
      vehicle = await querySingle(
        'INSERT INTO vehicles (customer_id, registration_number, vehicle_type, model, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [customer.id, vehicleReg, vehicleType || 'sedan', vehicleType || 'Not specified']
      );
      console.log('Vehicle created:', vehicle.id);
    } else {
      console.log('Existing vehicle found:', vehicle.id);
    }

    // Get service pricing
    let pricing;
    try {
      pricing = await querySingle(
        'SELECT base_price FROM service_pricing WHERE service_id = $1 AND vehicle_type = $2',
        [serviceId, vehicleType || 'sedan']
      );
    } catch (e) {
      // Fallback: get service base price directly
      pricing = await querySingle(
        'SELECT base_price FROM services WHERE id = $1',
        [serviceId]
      );
    }

    if (!pricing || !pricing.base_price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service pricing not found. Please contact admin.' 
      });
    }

    const finalAmount = pricing.base_price;
    console.log('Service amount:', finalAmount);

    // Generate queue number
    const todayCount = await query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE branch_id = $1 AND DATE(booking_date) = CURRENT_DATE`,
      [branchId]
    );
    const queueNumber = (parseInt(todayCount[0]?.count) || 0) + 1;
    console.log('Queue number:', queueNumber);

    // Create booking
    const booking = await querySingle(
      `INSERT INTO bookings (
        branch_id, customer_id, vehicle_id, service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source,
        bay_id, assigned_staff_id, created_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, 'pending', 'unpaid', 'walkin', $7, $8, NOW())
      RETURNING *`,
      [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount, bayId, staffId]
    );

    console.log('Booking created:', booking.id);

    // Update bay status if bay provided
    if (bayId) {
      try {
        await query(
          `UPDATE bays 
           SET status = 'occupied', 
               current_booking_id = $1
           WHERE id = $2`,
          [booking.id, bayId]
        );
        console.log('Bay updated:', bayId);
      } catch (bayError) {
        console.log('Bay update failed (non-critical):', bayError.message);
      }
    }

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

    console.log('Customer stats updated');

    // Get bay number for response
    let bayNumber = 'N/A';
    if (bayId) {
      try {
        const bay = await querySingle('SELECT bay_number FROM bays WHERE id = $1', [bayId]);
        bayNumber = bay?.bay_number || 'N/A';
      } catch (e) {
        console.log('Could not fetch bay number');
      }
    }

    console.log('=== WALK-IN REGISTERED SUCCESSFULLY ===');
    console.log('Queue #:', queueNumber);
    console.log('Vehicle:', vehicleReg);
    console.log('Bay:', bayNumber);
    console.log('Amount: Kshs', finalAmount);
    console.log('======================================');

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      queueNumber,
      bayNumber,
      amount: finalAmount,
      booking: {
        id: booking.id,
        vehicleReg,
        customerName: customerName || 'Walk-in Customer',
        phone
      }
    });
  } catch (error) {
    console.error('❌ WALK-IN ERROR:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: `Registration failed: ${error.message}` 
    });
  }
}