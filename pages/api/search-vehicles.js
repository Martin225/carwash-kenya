import { query } from '../../lib/db';

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.length < 3) {
    return res.status(200).json({ success: true, vehicles: [] });
  }

  try {
    const vehicles = await query(`
      SELECT 
        v.registration_number,
        v.vehicle_type,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        c.loyalty_points,
        c.total_visits,
        c.last_visit_date
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.id
      WHERE v.registration_number ILIKE $1
        AND v.is_active = true
      ORDER BY c.total_visits DESC
      LIMIT 5
    `, [`%${q}%`]);

    return res.status(200).json({
      success: true,
      vehicles
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}