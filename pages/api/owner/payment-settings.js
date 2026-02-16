import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const business = await querySingle(
        'SELECT payment_methods FROM businesses WHERE id = $1',
        [businessId]
      );

      if (!business) {
        return res.status(404).json({ success: false, message: 'Business not found' });
      }

      return res.status(200).json({
        success: true,
        settings: business.payment_methods || {
          mpesa: { enabled: false },
          bank: { enabled: false },
          cash: { enabled: true }
        }
      });
    } catch (error) {
      console.error('Error loading payment settings:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { businessId, settings } = req.body;

      if (!businessId || !settings) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      await query(
        'UPDATE businesses SET payment_methods = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(settings), businessId]
      );

      console.log('=== PAYMENT SETTINGS SAVED ===');
      console.log('Business ID:', businessId);
      console.log('Settings:', settings);
      console.log('============================');

      return res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}