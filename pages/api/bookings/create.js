import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, fullName, vehicleReg, vehicleType, serviceId, branchId, bookingDate, bookingTime } = req.body;

    // Find or create customer
    let customer = await querySingle('SELECT * FROM customers WHERE phone_number = $1', [phoneNumber]);
    
    if (!customer) {
      customer = await querySingle(
        'INSERT INTO customers (phone_number, full_name, loyalty_points, total_visits) VALUES ($1, $2, 0, 0) RETURNING *',
        [phoneNumber, fullName || '']
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
      return res.status(400).json({ success: false, message: 'Service pricing not found for this vehicle type' });
    }

    const finalAmount = pricing.base_price;
    const pointsEarned = 10; // Fixed 10 points per visit

    // Create booking
    const booking = await querySingle(
      `INSERT INTO bookings (
        branch_id, customer_id, vehicle_id, service_id,
        booking_date, booking_time, 
        total_amount, discount_amount, final_amount,
        status, payment_status, booking_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        branchId, customer.id, vehicle.id, serviceId,
        bookingDate, bookingTime,
        pricing.base_price, 0, finalAmount,
        'pending', 'unpaid', 'web'
      ]
    );

    // Update customer stats and loyalty points
    const newTotalVisits = (customer.total_visits || 0) + 1;
    const newLoyaltyPoints = (customer.loyalty_points || 0) + pointsEarned;
    
    await query(
      `UPDATE customers 
       SET total_visits = $1, 
           loyalty_points = $2,
           last_visit_date = NOW(),
           lifetime_value = lifetime_value + $3
       WHERE id = $4`,
      [newTotalVisits, newLoyaltyPoints, finalAmount, customer.id]
    );

    return res.status(201).json({
      success: true,
      booking,
      loyaltyEarned: pointsEarned,
      totalPoints: newLoyaltyPoints,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Booking error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}