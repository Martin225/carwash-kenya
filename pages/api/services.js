const { query } = require('../../lib/db');

export default async function handler(req, res) {
  console.log('API called, POSTGRES_URL:', process.env.POSTGRES_URL ? 'EXISTS' : 'MISSING');
  
  try {
    const branches = await query('SELECT * FROM branches WHERE is_active = true ORDER BY branch_name');
    const services = await query('SELECT s.id, s.service_name, s.service_name_swahili, s.base_duration_minutes, MIN(sp.base_price) as min_price FROM services s LEFT JOIN service_pricing sp ON s.id = sp.service_id WHERE s.is_active = true GROUP BY s.id, s.service_name, s.service_name_swahili, s.base_duration_minutes ORDER BY s.id');

    return res.status(200).json({ success: true, branches, services });
  } catch (error) {
    console.error('API ERROR:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}