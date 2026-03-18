import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get and sanitize input
    let { vehicleReg, phone, customerName, vehicleType, serviceId, bayId, staffIds, businessId, serviceCategory, paymentType } = req.body;
    
    // Convert staffIds to array if it's a single value
    if (staffIds && !Array.isArray(staffIds)) {
      staffIds = [staffIds];
    }
    
    // Convert empty strings to null for integer fields
    serviceId = (serviceId === '' || serviceId === undefined || serviceId === null) ? null : parseInt(serviceId);
    bayId = (bayId === '' || bayId === undefined || bayId === null) ? null : parseInt(bayId);
    businessId = (businessId === '' || businessId === undefined || businessId === null) ? null : parseInt(businessId);
    
    // Convert staff IDs to integers
    if (staffIds && staffIds.length > 0) {
      staffIds = staffIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    console.log('=== WALK-IN REGISTRATION START ===');
    console.log('Service Category:', serviceCategory);
    console.log('Vehicle:', vehicleReg);
    console.log('Phone:', phone);
    console.log('Customer:', customerName);
    console.log('Vehicle Type:', vehicleType);
    console.log('Service ID:', serviceId);
    console.log('Bay ID:', bayId);
    console.log('Staff IDs:', staffIds);
    console.log('Business ID:', businessId);
    console.log('Payment Type:', paymentType || 'cash');
    console.log('==================================');

    // Validate required fields
    if (!phone || !serviceId || !businessId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: Phone, service, and business ID are required' 
      });
    }

    // Vehicle reg required only for vehicle services
    if (serviceCategory === 'vehicle_service' && !vehicleReg) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle registration is required for vehicle services' 
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

    // Find existing customer by phone
    let customer = null;
    
    try {
      const customers = await query(
        `SELECT * FROM customers 
         WHERE phone_number = $1
         AND business_id = $2
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
      
      try {
        customer = await querySingle(
          `INSERT INTO customers (business_id, phone_number, full_name, loyalty_points, total_visits, outstanding_balance, created_at) 
           VALUES ($1, $2, $3, 0, 0, 0, NOW()) 
           RETURNING *`,
          [businessId, phone, customerName || 'Walk-in Customer']
        );
        console.log('New customer created:', customer.id);
      } catch (insertError) {
        console.error('Customer insert error:', insertError.message);
        throw new Error('Failed to create customer');
      }
    }

    // Find or create vehicle (ONLY for vehicle services)
    let vehicle = null;
    
    if (serviceCategory === 'vehicle_service' && vehicleReg) {
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
            'INSERT INTO vehicles (customer_id, registration_number, vehicle_type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [customer.id, vehicleReg, vehicleType]
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
      console.log('No vehicle required - other service booking');
    }

    // Get service and pricing
    let finalAmount;
    
    try {
      const service = await querySingle(
        'SELECT service_category, fixed_price FROM services WHERE id = $1',
        [serviceId]
      );

      if (service.service_category === 'other_service') {
        finalAmount = parseFloat(service.fixed_price);
        console.log('Other service - using fixed price:', finalAmount);
      } else {
        const pricing = await querySingle(
          'SELECT base_price FROM service_pricing WHERE service_id = $1 AND vehicle_type = $2',
          [serviceId, vehicleType || 'sedan']
        );
        
        if (!pricing || !pricing.base_price) {
          throw new Error('Vehicle service pricing not found');
        }
        
        finalAmount = parseFloat(pricing.base_price);
        console.log('Vehicle service - using vehicle type price:', finalAmount);
      }
    } catch (pricingError) {
      console.error('Pricing error:', pricingError.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Service pricing not found. Please contact admin.' 
      });
    }

    console.log('Final amount:', finalAmount);

    // Set payment type and status
    const finalPaymentType = paymentType || 'cash';
    const paymentStatus = finalPaymentType === 'credit' ? 'unpaid' : 'pending';

    console.log('Payment Type:', finalPaymentType);
    console.log('Payment Status:', paymentStatus);

    // Generate queue number
    const todayCount = await query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE branch_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [branchId]
    );
    const queueNumber = (parseInt(todayCount[0]?.count) || 0) + 1;
    console.log('Queue number:', queueNumber);

    // Create booking
    let booking;
    
    if (vehicle) {
      // Vehicle service booking
      const params = [branchId, customer.id, vehicle.id, serviceId, finalAmount, paymentStatus, finalPaymentType];
      let paramIndex = 8;
      let bayCol = '';
      let bayVal = '';
      
      if (bayId) {
        bayCol = 'bay_id,';
        bayVal = `$${paramIndex},`;
        params.push(bayId);
        paramIndex++;
      }
      
      booking = await querySingle(
        `INSERT INTO bookings (
          branch_id, customer_id, vehicle_id, service_id,
          booking_date, booking_time,
          total_amount, final_amount, payment_status, payment_type,
          ${bayCol} created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_TIME, $5, $5, $6, $7, ${bayVal} NOW())
        RETURNING *`,
        params
      );
    } else {
      // Other service booking (no vehicle)
      booking = await querySingle(
        `INSERT INTO bookings (
          branch_id, customer_id, service_id,
          booking_date, booking_time,
          total_amount, final_amount, payment_status, payment_type,
          created_at
        ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME, $4, $4, $5, $6, NOW())
        RETURNING *`,
        [branchId, customer.id, serviceId, finalAmount, paymentStatus, finalPaymentType]
      );
    }

    console.log('Booking created:', booking.id, 'Payment Type:', finalPaymentType);

    // Assign staff to booking (multiple staff support)
    if (staffIds && staffIds.length > 0) {
      console.log('Assigning', staffIds.length, 'staff to booking');
      
      for (const staffId of staffIds) {
        await query(
          `INSERT INTO booking_staff (booking_id, staff_id, created_at)
           VALUES ($1, $2, NOW())`,
          [booking.id, staffId]
        );
        console.log('Staff assigned:', staffId);
      }
      
      // Also set assigned_staff_id to first staff for backwards compatibility
      await query(
        `UPDATE bookings SET assigned_staff_id = $1 WHERE id = $2`,
        [staffIds[0], booking.id]
      );
      
      // Update bay with first staff if bay assigned
      if (bayId && serviceCategory === 'vehicle_service') {
        try {
          await query(
            `UPDATE bays 
             SET status = 'occupied', 
                 current_booking_id = $1,
                 current_staff_id = $2
             WHERE id = $3`,
            [booking.id, staffIds[0], bayId]
          );
          console.log('Bay updated:', bayId, 'with staff:', staffIds[0]);
        } catch (bayError) {
          console.log('Bay update failed (non-critical):', bayError.message);
        }
      }
    } else {
      console.log('No staff assigned to booking');
    }

    // Update customer outstanding balance if credit
    if (finalPaymentType === 'credit') {
      await query(
        `UPDATE customers 
         SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1
         WHERE id = $2`,
        [finalAmount, customer.id]
      );
      console.log('Customer outstanding balance updated +', finalAmount);
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
    let bayNumber = serviceCategory === 'other_service' ? 'N/A (other service)' : 'N/A';
    if (bayId && serviceCategory === 'vehicle_service') {
      try {
        const bay = await querySingle('SELECT bay_number FROM bays WHERE id = $1', [bayId]);
        bayNumber = bay?.bay_number || 'N/A';
      } catch (e) {
        console.log('Could not fetch bay number');
      }
    }

    console.log('=== REGISTRATION SUCCESSFUL ===');
    console.log('Category:', serviceCategory);
    console.log('Queue #:', queueNumber);
    console.log('Vehicle:', vehicleReg || 'N/A (other service)');
    console.log('Bay:', bayNumber);
    console.log('Staff Count:', staffIds?.length || 0);
    console.log('Amount: Kshs', finalAmount);
    console.log('Payment:', finalPaymentType);
    console.log('======================================');

    return res.status(201).json({
      success: true,
      message: finalPaymentType === 'credit' 
        ? 'Customer registered - added to unpaid bills' 
        : 'Customer registered successfully',
      queueNumber,
      bayNumber,
      amount: finalAmount,
      paymentType: finalPaymentType,
      staffCount: staffIds?.length || 0,
      booking: {
        id: booking.id,
        vehicleReg: vehicleReg || null,
        customerName: customerName || 'Walk-in Customer',
        phone,
        serviceCategory
      }
    });
  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: `Registration failed: ${error.message}` 
    });
  }
}