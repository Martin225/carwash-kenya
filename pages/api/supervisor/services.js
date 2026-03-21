import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  const { businessId } = req.query;

  // GET - Load services (FIX 3: Only return ACTIVE services for walk-in dropdown)
  if (req.method === 'GET') {
    try {
      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(200).json({ success: true, services: [] });
      }

      const branchIds = branches.map(b => b.id);

      // Get all services with category (including inactive for management page)
      const services = await query(
        `SELECT 
          s.*,
          COALESCE(s.service_category, 'vehicle_service') as service_category,
          s.fixed_price
        FROM services s
        WHERE s.branch_id = ANY($1)
        ORDER BY s.is_active DESC, s.service_name ASC`,
        [branchIds]
      );

      // Get pricing for each service
      const servicesWithPricing = await Promise.all(
        services.map(async (service) => {
          const pricing = await query(
            `SELECT vehicle_type, base_price 
             FROM service_pricing 
             WHERE service_id = $1`,
            [service.id]
          );

          const pricingObj = {};
          pricing.forEach(p => {
            pricingObj[p.vehicle_type] = parseFloat(p.base_price);
          });

          return {
            id: service.id,
            name: service.service_name,
            description: service.description,
            service_category: service.service_category,
            fixed_price: service.fixed_price ? parseFloat(service.fixed_price) : null,
            pricing: pricingObj,
            isActive: service.is_active
          };
        })
      );

      return res.status(200).json({
        success: true,
        services: servicesWithPricing
      });

    } catch (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST - Create new service
  if (req.method === 'POST') {
    try {
      const { 
        serviceName, 
        description, 
        serviceCategory, 
        fixedPrice, 
        pricing, 
        businessId 
      } = req.body;

      if (!businessId || !serviceName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Business ID and service name required' 
        });
      }

      // Get branch ID
      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1 LIMIT 1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No branch found for this business' 
        });
      }

      const branchId = branches[0].id;

      // Validate based on category
      if (serviceCategory === 'other_service') {
        if (!fixedPrice || parseFloat(fixedPrice) <= 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Fixed price required for other services' 
          });
        }
      } else {
        // Vehicle service - check at least one price
        const hasPricing = pricing && Object.values(pricing).some(p => p && parseFloat(p) > 0);
        if (!hasPricing) {
          return res.status(400).json({ 
            success: false, 
            message: 'At least one vehicle type price required' 
          });
        }
      }

      // Create service
      const service = await querySingle(
        `INSERT INTO services (
          branch_id, 
          service_name, 
          description, 
          service_category, 
          fixed_price, 
          is_active
        ) VALUES ($1, $2, $3, $4, $5, true) 
        RETURNING id`,
        [
          branchId, 
          serviceName, 
          description || null, 
          serviceCategory || 'vehicle_service',
          serviceCategory === 'other_service' ? fixedPrice : null
        ]
      );

      // If vehicle service, insert pricing
      if (serviceCategory === 'vehicle_service' && pricing) {
        for (const [vehicleType, price] of Object.entries(pricing)) {
          if (price && parseFloat(price) > 0) {
            await query(
              `INSERT INTO service_pricing (service_id, vehicle_type, base_price)
               VALUES ($1, $2, $3)`,
              [service.id, vehicleType, price]
            );
          }
        }
      }

      console.log('✅ Service created:', serviceName, '| Category:', serviceCategory);

      return res.status(201).json({
        success: true,
        message: 'Service created successfully',
        serviceId: service.id
      });

    } catch (error) {
      console.error('Error creating service:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT - Update service
  if (req.method === 'PUT') {
    try {
      const { 
        serviceId, 
        serviceName, 
        description, 
        serviceCategory,
        fixedPrice,
        pricing, 
        isActive,
        businessId 
      } = req.body;

      if (!serviceId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Service ID required' 
        });
      }

      // Update service
      await query(
        `UPDATE services 
         SET service_name = $1, 
             description = $2, 
             service_category = $3,
             fixed_price = $4,
             is_active = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          serviceName, 
          description || null, 
          serviceCategory || 'vehicle_service',
          serviceCategory === 'other_service' ? fixedPrice : null,
          isActive !== undefined ? isActive : true, 
          serviceId
        ]
      );

      // Update pricing if vehicle service
      if (serviceCategory === 'vehicle_service' && pricing) {
        // Delete existing pricing
        await query('DELETE FROM service_pricing WHERE service_id = $1', [serviceId]);

        // Insert new pricing
        for (const [vehicleType, price] of Object.entries(pricing)) {
          if (price && parseFloat(price) > 0) {
            await query(
              `INSERT INTO service_pricing (service_id, vehicle_type, base_price)
               VALUES ($1, $2, $3)`,
              [serviceId, vehicleType, price]
            );
          }
        }
      }

      console.log('✅ Service updated:', serviceName);

      return res.status(200).json({
        success: true,
        message: 'Service updated successfully'
      });

    } catch (error) {
      console.error('Error updating service:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE - Delete service (NEW!)
  if (req.method === 'DELETE') {
    try {
      const { serviceId } = req.body;

      if (!serviceId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Service ID required' 
        });
      }

      // Check if service has any bookings
      const bookingsCount = await query(
        'SELECT COUNT(*) as count FROM bookings WHERE service_id = $1',
        [serviceId]
      );

      const hasBookings = parseInt(bookingsCount[0]?.count || 0) > 0;

      if (hasBookings) {
        // Service has bookings - deactivate instead of delete
        await query(
          'UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1',
          [serviceId]
        );

        console.log('✅ Service deactivated (has booking history):', serviceId);

        return res.status(200).json({
          success: true,
          message: 'Service deactivated (has booking history)',
          deactivated: true
        });
      } else {
        // No bookings - safe to delete permanently
        
        // First delete pricing records
        await query('DELETE FROM service_pricing WHERE service_id = $1', [serviceId]);
        
        // Then delete the service
        await query('DELETE FROM services WHERE id = $1', [serviceId]);

        console.log('✅ Service deleted permanently:', serviceId);

        return res.status(200).json({
          success: true,
          message: 'Service deleted permanently',
          deleted: true
        });
      }

    } catch (error) {
      console.error('Error deleting service:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to delete service' 
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}