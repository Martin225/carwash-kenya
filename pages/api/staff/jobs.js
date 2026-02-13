import { query } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { staffId } = req.query;

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID required' });
    }

    const jobs = await query(`
      SELECT 
        bk.id,
        bk.booking_code,
        bk.booking_time,
        bk.status,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        s.service_name,
        b.bay_number
      FROM bookings bk
      JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      LEFT JOIN bays b ON bk.bay_id = b.id
      WHERE bk.assigned_staff_id = $1
        AND bk.booking_date = CURRENT_DATE
      ORDER BY bk.booking_time
    `, [staffId]);

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const stats = {
      todayJobs: jobs.length,
      completed: completedJobs.length,
      earnings: completedJobs.length * 50
    };

    return res.status(200).json({
      success: true,
      jobs,
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