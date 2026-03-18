import { query } from '../../lib/db';

export default async function handler(req, res) {
  const { q, businessId, branchId } = req.query;
  
  if (!q || q.length < 3) {
    return res.status(200).json({ success: true, vehicles: [] });
  }

  // Require businessId for data isolation
  if (!businessId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Business ID required for search' 
    });
  }

  try {
    // Search only vehicles that have visited THIS business
    const vehicles = await query(`
      SELECT DISTINCT ON (v.registration_number)
        v.registration_number,
        v.vehicle_type,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        c.loyalty_points,
        c.total_visits,
        c.last_visit_date
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.id
      JOIN bookings b ON v.id = b.vehicle_id
      JOIN branches br ON b.branch_id = br.id
      WHERE v.registration_number ILIKE $1
        AND v.is_active = true
        AND br.business_id = $2
      ORDER BY v.registration_number, c.total_visits DESC
      LIMIT 5
    `, [`%${q}%`, businessId]);

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