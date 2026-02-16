import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get and sanitize input - convert empty strings to null for database
    let { vehicleReg, phone, customerName, vehicleType, serviceId, bayId, staffId, businessId } = req.body;
    
    // Convert empty strings to null for integer fields
    serviceId = (serviceId === '' || serviceId === undefined || serviceId === null) ? null : parseInt(serviceId);
    bayId = (bayId === '' || bayId === undefined || bayId === null) ? null : parseInt(bayId);
    staffId = (staffId === '' || staffId === undefined || staffId === null) ? null : parseInt(staffId);
    businessId = (businessId === '' || businessId === undefined || businessId === null) ? null : parseInt(businessId);

    console.log('=== WALK-IN REGISTRATION START ===');
    console.log('Vehicle:', vehicleReg);
    console.log('Phone:', phone);
    console.log('Customer:', customerName);
    console.log('Vehicle Type:', vehicleType);
    console.log('Service ID:', serviceId);
    console.log('Bay ID:', bayId);
    console.log('Staff ID:', staffId);
    console.log('Business ID:', businessId);
    console.log('==================================');

    // Validate required fields
    if (!vehicleReg || !phone || !serviceId || !businessId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: vehicle registration, phone, service, and business ID are required' 
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

    // Find existing customer by phone (one customer can have multiple cars!)
    let customer = null;
    
    try {
      const customers = await query(
        `SELECT * FROM customers 
         WHERE (phone = $1 OR phone_number = $1)
         AND (business_id = $2 OR business_id IS NULL)
         LIMIT 1`,
        [phone, businessId]
      );
      
      if (customers && customers.length > 0) {
        customer = customers[0];
        console.log('Found existing customer:', customer.id);
      }
    } catch (lookupError) {
      console.log('Customer lookup failed (will create new):', lookupError.message);
    }

    // Create new customer if not found
    if (!customer) {
      console.log('Creating new customer...');
      
      // Check if business_id column exists
      const hasBusinessId = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'customers' 
         AND column_name = 'business_id'`
      );

      const useBusinessId = hasBusinessId && hasBusinessId.length > 0;

      try {
        // Try with 'phone' column first
        if (useBusinessId) {
          customer = await querySingle(
            `INSERT INTO customers (business_id, phone, full_name, loyalty_points, total_visits, created_at) 
             VALUES ($1, $2, $3, 0, 0, NOW()) 
             RETURNING *`,
            [businessId, phone, customerName || 'Walk-in Customer']
          );
        } else {
          customer = await querySingle(
            `INSERT INTO customers (phone, full_name, loyalty_points, total_visits, created_at) 
             VALUES ($1, $2, 0, 0, NOW()) 
             RETURNING *`,
            [phone, customerName || 'Walk-in Customer']
          );
        }
      } catch (phoneError) {
        // Fallback to 'phone_number' column
        console.log('Trying phone_number column instead...');
        if (useBusinessId) {
          customer = await querySingle(
            `INSERT INTO customers (business_id, phone_number, full_name, loyalty_points, total_visits, created_at) 
             VALUES ($1, $2, $3, 0, 0, NOW()) 
             RETURNING *`,
            [businessId, phone, customerName || 'Walk-in Customer']
          );
        } else {
          customer = await querySingle(
            `INSERT INTO customers (phone_number, full_name, loyalty_points, total_visits, created_at) 
             VALUES ($1, $2, 0, 0, NOW()) 
             RETURNING *`,
            [phone, customerName || 'Walk-in Customer']
          );
        }
      }
      console.log('New customer created:', customer.id);
    }

// Find or create vehicle (ONLY if vehicle type is not "none")
    let vehicle = null;
    
    if (vehicleType !== 'none' && vehicleReg) {
      try {
        vehicle = await querySingle(
          'SELECT * FROM vehicles WHERE registration_number = $1',
          [vehicleReg]
        );
        
        if (vehicle) {
          console.log('Found existing vehicle:', vehicle.id, 'Owner customer_id:', vehicle.customer_id);
          
          if (vehicle.customer_id !== customer.id) {
            console.log('WARNING: Vehicle belongs to different customer!');
            await query(
              'UPDATE vehicles SET customer_id = $1 WHERE id = $2',
              [customer.id, vehicle.id]
            );
            console.log('Vehicle ownership transferred to customer:', customer.id);
          }
        }
      } catch (vehicleLookupError) {
        console.log('Vehicle lookup failed:', vehicleLookupError.message);
        vehicle = null;
      }

      // Create vehicle if it doesn't exist
      if (!vehicle) {
        console.log('Creating new vehicle...');
        try {
          vehicle = await querySingle(
            'INSERT INTO vehicles (customer_id, registration_number, vehicle_type, model, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [customer.id, vehicleReg, vehicleType, vehicleType || 'Not specified']
          );
          console.log('New vehicle created:', vehicle.id, 'for customer:', customer.id);
        } catch (insertError) {
          console.log('Vehicle insert failed, fetching existing vehicle...', insertError.message);
          vehicle = await querySingle(
            'SELECT * FROM vehicles WHERE registration_number = $1',
            [vehicleReg]
          );
          
          if (vehicle) {
            console.log('Using existing vehicle:', vehicle.id);
            await query(
              'UPDATE vehicles SET customer_id = $1 WHERE id = $2',
              [customer.id, vehicle.id]
            );
          } else {
            throw new Error('Failed to create or find vehicle');
          }
        }
      }
    } else {
      console.log('No vehicle required - service only booking');
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

// Create booking - handle optional vehicle
    let bookingSql = '';
    let bookingParams = [];
    
    if (bayId && staffId) {
      bookingSql = `INSERT INTO bookings (
        branch_id, customer_id, ${vehicle ? 'vehicle_id,' : ''} service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source,
        bay_id, assigned_staff_id, created_at
      ) VALUES ($1, $2, ${vehicle ? '$3, $4' : '$3'}, NOW(), NOW(), ${vehicle ? '$5, $6' : '$4, $5'}, 'pending', 'unpaid', 'walkin', ${vehicle ? '$7, $8' : '$6, $7'}, NOW())
      RETURNING *`;
      bookingParams = vehicle 
        ? [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount, bayId, staffId]
        : [branchId, customer.id, serviceId, finalAmount, finalAmount, bayId, staffId];
    } else if (bayId && !staffId) {
      bookingSql = `INSERT INTO bookings (
        branch_id, customer_id, ${vehicle ? 'vehicle_id,' : ''} service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source,
        bay_id, created_at
      ) VALUES ($1, $2, ${vehicle ? '$3, $4' : '$3'}, NOW(), NOW(), ${vehicle ? '$5, $6' : '$4, $5'}, 'pending', 'unpaid', 'walkin', ${vehicle ? '$7' : '$6'}, NOW())
      RETURNING *`;
      bookingParams = vehicle
        ? [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount, bayId]
        : [branchId, customer.id, serviceId, finalAmount, finalAmount, bayId];
    } else if (!bayId && staffId) {
      bookingSql = `INSERT INTO bookings (
        branch_id, customer_id, ${vehicle ? 'vehicle_id,' : ''} service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source,
        assigned_staff_id, created_at
      ) VALUES ($1, $2, ${vehicle ? '$3, $4' : '$3'}, NOW(), NOW(), ${vehicle ? '$5, $6' : '$4, $5'}, 'pending', 'unpaid', 'walkin', ${vehicle ? '$7' : '$6'}, NOW())
      RETURNING *`;
      bookingParams = vehicle
        ? [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount, staffId]
        : [branchId, customer.id, serviceId, finalAmount, finalAmount, staffId];
    } else {
      bookingSql = `INSERT INTO bookings (
        branch_id, customer_id, ${vehicle ? 'vehicle_id,' : ''} service_id,
        booking_date, booking_time,
        total_amount, final_amount,
        status, payment_status, booking_source, created_at
      ) VALUES ($1, $2, ${vehicle ? '$3, $4' : '$3'}, NOW(), NOW(), ${vehicle ? '$5, $6' : '$4, $5'}, 'pending', 'unpaid', 'walkin', NOW())
      RETURNING *`;
      bookingParams = vehicle
        ? [branchId, customer.id, vehicle.id, serviceId, finalAmount, finalAmount]
        : [branchId, customer.id, serviceId, finalAmount, finalAmount];
    }

    const booking = await querySingle(bookingSql, bookingParams);
    console.log('Booking created:', booking.id, 'Vehicle:', vehicle ? vehicle.id : 'None');
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
    } else {
      console.log('No bay assigned - car queued');
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
    console.log('Staff ID:', staffId || 'Not assigned');
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