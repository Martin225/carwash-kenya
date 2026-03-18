import { query } from '../../lib/db';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // GET: Fetch all features for a business
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      // Feature metadata (descriptions, categories, etc.)
      const featureMetadata = {
        inventory_management: {
          feature_name: 'Inventory Management',
          description: 'Track soap, wax, cleaning supplies with low stock alerts and usage reports.',
          category: 'operations',
          is_premium: false
        },
        sms_notifications: {
          feature_name: 'SMS Notifications',
          description: 'Send automated SMS notifications to customers for bookings, payments, and promotions.',
          category: 'communications',
          is_premium: false
        },
        credit_customers: {
          feature_name: 'Credit Customers & Invoicing',
          description: 'Track unpaid bills, monthly invoicing for corporate clients. Monthly billing and payment tracking.',
          category: 'billing',
          is_premium: false
        },
        multi_staff_assignment: {
          feature_name: 'Multi-Staff Assignment',
          description: 'Assign multiple staff members to a single job with automatic commission splitting.',
          category: 'operations',
          is_premium: false
        },
        loyalty_program: {
          feature_name: 'Loyalty Program',
          description: 'Reward customers with points, discounts, and exclusive benefits for repeat visits.',
          category: 'customer',
          is_premium: true
        },
        service_packages: {
          feature_name: 'Service Packages',
          description: 'Create bundled services and subscription packages for regular customers.',
          category: 'customer',
          is_premium: true
        },
        online_booking: {
          feature_name: 'Online Booking Portal',
          description: 'Let customers book appointments online through a public booking page.',
          category: 'customer',
          is_premium: true
        },
        mobile_app: {
          feature_name: 'Mobile App Access',
          description: 'Give customers access to your branded mobile app for iOS and Android.',
          category: 'integrations',
          is_premium: true
        }
      };

      // Fetch business features from database
      const businessFeatures = await query(
        `SELECT * FROM business_features 
         WHERE business_id = $1 
         ORDER BY feature_code`,
        [businessId]
      );

      if (!businessFeatures || businessFeatures.length === 0) {
        return res.status(200).json({ 
          success: true, 
          allFeatures: [],
          count: 0,
          message: 'No features found. Please run the SQL to add features.'
        });
      }

      // Combine database data with metadata
      const allFeatures = businessFeatures.map(bf => ({
        ...bf,
        ...featureMetadata[bf.feature_code],
        feature_name: featureMetadata[bf.feature_code]?.feature_name || bf.feature_code,
        description: featureMetadata[bf.feature_code]?.description || 'No description available',
        category: featureMetadata[bf.feature_code]?.category || 'other',
        is_premium: featureMetadata[bf.feature_code]?.is_premium || false
      }));

      return res.status(200).json({ 
        success: true, 
        allFeatures,
        count: allFeatures.length
      });

    } else if (method === 'PUT') {
      // PUT: Toggle a feature on/off
      const { businessId, featureCode, isEnabled } = req.body;

      if (!businessId || !featureCode) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const result = await query(
        `UPDATE business_features 
         SET is_enabled = $1, 
             enabled_at = $2
         WHERE business_id = $3 
           AND feature_code = $4
         RETURNING *`,
        [
          isEnabled,
          isEnabled ? new Date().toISOString() : null,
          businessId,
          featureCode
        ]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Feature not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: `Feature ${isEnabled ? 'enabled' : 'disabled'}`,
        feature: result[0]
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}