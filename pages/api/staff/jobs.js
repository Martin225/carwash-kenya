import { query } from '../../../lib/db';

console.log('🚨 STAFF JOBS API - MULTI-STAFF SUPPORT');

export default async function handler(req, res) {
  try {
    const { staffId } = req.query;
    
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID required' });
    }

    console.log('📋 Fetching jobs for staff ID:', staffId);

    // FIX: Check BOTH assigned_staff_id AND booking_staff table
    const jobs = await query(`
      SELECT DISTINCT
        bk.id,
        bk.booking_code,
        bk.booking_time,
        bk.status,
        bk.final_amount,
        v.registration_number as vehicle_reg,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        s.service_name,
        s.service_category,
        b.bay_number,
        staff.commission_percentage,
        -- Count how many staff are assigned to calculate commission split
        (SELECT COUNT(*) FROM booking_staff WHERE booking_id = bk.id) as staff_count
      FROM bookings bk
      LEFT JOIN vehicles v ON bk.vehicle_id = v.id
      JOIN customers c ON bk.customer_id = c.id
      JOIN services s ON bk.service_id = s.id
      LEFT JOIN bays b ON bk.bay_id = b.id
      JOIN staff ON staff.id = $1
      WHERE (
        -- Check old single-staff assignment
        bk.assigned_staff_id = $1
        OR
        -- Check new multi-staff assignment table
        bk.id IN (
          SELECT booking_id 
          FROM booking_staff 
          WHERE staff_id = $1
        )
      )
      AND DATE(bk.booking_date) = CURRENT_DATE
      ORDER BY bk.booking_time
    `, [staffId]);

    console.log('✅ Found jobs:', jobs.length);

    // Calculate actual earnings based on commission percentage and staff split
    let totalEarnings = 0;
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    completedJobs.forEach(job => {
      const commissionPercentage = parseFloat(job.commission_percentage || 0);
      const finalAmount = parseFloat(job.final_amount || 0);
      const staffCount = parseInt(job.staff_count || 1);
      
      // Commission = (final_amount × staff's %) ÷ number of staff on job
      const jobCommission = (finalAmount * (commissionPercentage / 100)) / staffCount;
      totalEarnings += jobCommission;
    });

    const stats = {
      todayJobs: jobs.length,
      completed: completedJobs.length,
      earnings: Math.round(totalEarnings) // Round to nearest shilling
    };

    console.log('💰 Earnings breakdown:');
    console.log('   Total jobs:', jobs.length);
    console.log('   Completed:', completedJobs.length);
    console.log('   Total earnings: Kshs', stats.earnings);

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