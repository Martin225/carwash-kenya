const { query, querySingle } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, fullName, vehicleReg, vehicleType, serviceId, branchId, bookingDate, bookingTime } = req.body;

    let customer = await querySingle('SELECT * FROM customers WHERE phone_number = $1', [phoneNumber]);
    if (!customer) {
      customer = await querySingle('INSERT INTO customers (phone_number, full_name) VALUES ($1, $2) RETURNING *', [phoneNumber, fullName || '']);
    }

    let vehicle = await querySingle('SELECT * FROM vehicles WHERE registration_number = $1', [vehicleReg]);
    if (!vehicle) {
      vehicle = await querySingle('INSERT INTO vehicles (customer_id, registration_number, vehicle_type) VALUES ($1, $2, $3) RETURNING *', [customer.id, vehicleReg, vehicleType]);
    }

    const pricing = await querySingle('SELECT base_price FROM service_pricing WHERE service_id = $1 AND vehicle_type = $2', [serviceId, vehicleType]);
    if (!pricing) {
      return res.status(400).json({ success: false, message: 'Service pricing not found for this vehicle type' });
    }

    const booking = await querySingle(
      'INSERT INTO bookings (branch_id, customer_id, vehicle_id, service_id, booking_date, booking_time, total_amount, final_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [branchId, customer.id, vehicle.id, serviceId, bookingDate, bookingTime, pricing.base_price, pricing.base_price]
    );

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('Booking error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}