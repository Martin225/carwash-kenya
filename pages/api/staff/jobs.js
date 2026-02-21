import { query } from '../../../lib/db';

console.log('🚨 STAFF JOBS API - USING phone_number ONLY');

export default async function handler(req, res) {
  try {
    const { staffId } = req.query;

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID required' });
    }

    console.log('📋 Fetching jobs for staff ID:', staffId);

    // Use phone_number instead of phone
    const jobs = await query(`
      SELECT 
        bk.id,
        bk.booking_code,
        bk.booking_time,
        bk.status,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        s.service_name,
        b.bay_number
      FROM bookings bk
      LEFT JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      LEFT JOIN bays b ON bk.bay_id = b.id
      WHERE bk.assigned_staff_id = $1
        AND DATE(bk.booking_date) = CURRENT_DATE
      ORDER BY bk.booking_time
    `, [staffId]);

    console.log('✅ Found jobs:', jobs.length);

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
    console.error('❌ Staff jobs API error:', error);
    console.error('Error details:', error.message);
    
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}