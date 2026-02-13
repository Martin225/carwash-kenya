import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    const branches = await query(
      'SELECT id FROM branches WHERE business_id = $1',
      [businessId]
    );

    if (branches.length === 0) {
      return res.status(200).json({
        success: true,
        bays: [],
        todayBookings: [],
        pendingApprovals: [],
        staff: [],
        stats: { carsToday: 0, revenueToday: 0, activeBays: 0, staffOnDuty: 0 }
      });
    }

    const branchId = branches[0].id;

    const bays = await query(`
      SELECT 
        b.*,
        bk.id as booking_id,
        v.registration_number as current_vehicle,
        c.full_name as customer_name,
        s.service_name,
        st.full_name as staff_name
      FROM bays b
      LEFT JOIN bookings bk ON b.current_booking_id = bk.id
      LEFT JOIN vehicles v ON bk.vehicle_id = v.id
      LEFT JOIN customers c ON bk.customer_id = c.id
      LEFT JOIN services s ON bk.service_id = s.id
      LEFT JOIN staff st ON b.current_staff_id = st.id
      WHERE b.branch_id = $1
      ORDER BY b.bay_number
    `, [branchId]);

    const todayBookings = await query(`
      SELECT 
        bk.*,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        s.service_name
      FROM bookings bk
      JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      WHERE bk.branch_id = $1
        AND bk.booking_date = CURRENT_DATE
      ORDER BY bk.booking_time
    `, [branchId]);

    const pendingApprovals = await query(`
      SELECT 
        bk.*,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as phone,
        s.service_name
      FROM bookings bk
      JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      WHERE bk.branch_id = $1
        AND bk.status = 'pending'
        AND bk.booking_source = 'web'
        AND bk.approved_at IS NULL
      ORDER BY bk.created_at DESC
    `, [branchId]);

    const staff = await query(
      'SELECT * FROM staff WHERE branch_id = $1 AND is_active = true',
      [branchId]
    );

    const completedToday = todayBookings.filter(b => b.status === 'completed');
    const stats = {
      carsToday: completedToday.length,
      revenueToday: completedToday.reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0),
      activeBays: bays.filter(b => b.status === 'occupied').length,
      staffOnDuty: staff.length
    };

    return res.status(200).json({
      success: true,
      bays,
      todayBookings,
      pendingApprovals,
      staff,
      stats
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}