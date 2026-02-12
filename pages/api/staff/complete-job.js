import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { jobId } = req.body;

    await query(
      `UPDATE bookings 
       SET status = 'completed',
           actual_end_time = NOW()
       WHERE id = $1`,
      [jobId]
    );

    // Update bay status to available
    await query(
      `UPDATE bays 
       SET status = 'available',
           current_booking_id = NULL,
           current_staff_id = NULL
       WHERE current_booking_id = $1`,
      [jobId]
    );

    return res.status(200).json({
      success: true,
      message: 'Job marked as complete'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}