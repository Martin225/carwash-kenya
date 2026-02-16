import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  // GET - Load all services
  if (req.method === 'GET') {
    try {
      const { businessId, vehicleType } = req.query;

      if (!businessId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Business ID required' 
        });
      }

      // Get all active services
      const services = await query(
        `SELECT id, service_name, description, base_price, is_active, created_at
         FROM services
         WHERE is_active = true
         ORDER BY service_name`,
        []
      );

      // If vehicle type provided, get specific pricing
      if (vehicleType) {
        const servicesWithPricing = await Promise.all(
          services.map(async (service) => {
            try {
              const pricing = await query(
                `SELECT base_price 
                 FROM service_pricing 
                 WHERE service_id = $1 AND vehicle_type = $2`,
                [service.id, vehicleType]
              );

              return {
                id: service.id,
                name: service.service_name,
                description: service.description,
                price: pricing.length > 0 ? pricing[0].base_price : service.base_price
              };
            } catch (e) {
              return {
                id: service.id,
                name: service.service_name,
                description: service.description,
                price: service.base_price
              };
            }
          })
        );

        return res.status(200).json({
          success: true,
          services: servicesWithPricing
        });
      }

      // Return all services with their pricing for all vehicle types
      const servicesWithAllPricing = await Promise.all(
        services.map(async (service) => {
          const pricing = await query(
            `SELECT vehicle_type, base_price 
             FROM service_pricing 
             WHERE service_id = $1`,
            [service.id]
          );

          const pricingMap = {};
          pricing.forEach(p => {
            pricingMap[p.vehicle_type] = p.base_price;
          });

          return {
            id: service.id,
            name: service.service_name,
            description: service.description,
            basePrice: service.base_price,
            isActive: service.is_active,
            pricing: pricingMap
          };
        })
      );

      return res.status(200).json({
        success: true,
        services: servicesWithAllPricing
      });
    } catch (error) {
      console.error('Error loading services:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // POST - Create new service
  if (req.method === 'POST') {
    try {
      const { serviceName, description, basePrice, pricing } = req.body;

      if (!serviceName || !basePrice) {
        return res.status(400).json({
          success: false,
          message: 'Service name and base price are required'
        });
      }

      // Create service
      const service = await querySingle(
        `INSERT INTO services (service_name, description, base_price, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW())
         RETURNING *`,
        [serviceName, description || '', parseFloat(basePrice)]
      );

      // Create pricing for each vehicle type
      if (pricing) {
        const vehicleTypes = ['sedan', 'suv', 'truck', 'matatu'];
        
        for (const type of vehicleTypes) {
          if (pricing[type]) {
            await query(
              `INSERT INTO service_pricing (service_id, vehicle_type, base_price)
               VALUES ($1, $2, $3)
               ON CONFLICT (service_id, vehicle_type) 
               DO UPDATE SET base_price = $3`,
              [service.id, type, parseFloat(pricing[type])]
            );
          }
        }
      }

      console.log('=== SERVICE CREATED ===');
      console.log('Service:', serviceName);
      console.log('ID:', service.id);
      console.log('======================');

      return res.status(201).json({
        success: true,
        message: 'Service created successfully',
        service
      });
    } catch (error) {
      console.error('Error creating service:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT - Update service
  if (req.method === 'PUT') {
    try {
      const { serviceId, serviceName, description, basePrice, pricing, isActive } = req.body;

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
             base_price = $3,
             is_active = $4
         WHERE id = $5`,
        [serviceName, description || '', parseFloat(basePrice), isActive !== false, serviceId]
      );

      // Update pricing for each vehicle type
      if (pricing) {
        const vehicleTypes = ['sedan', 'suv', 'truck', 'matatu'];
        
        for (const type of vehicleTypes) {
          if (pricing[type]) {
            await query(
              `INSERT INTO service_pricing (service_id, vehicle_type, base_price)
               VALUES ($1, $2, $3)
               ON CONFLICT (service_id, vehicle_type) 
               DO UPDATE SET base_price = $3`,
              [serviceId, type, parseFloat(pricing[type])]
            );
          }
        }
      }

      console.log('=== SERVICE UPDATED ===');
      console.log('Service ID:', serviceId);
      console.log('======================');

      return res.status(200).json({
        success: true,
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Error updating service:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE - Deactivate service (soft delete)
  if (req.method === 'DELETE') {
    try {
      const { serviceId } = req.body;

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          message: 'Service ID required'
        });
      }

      await query(
        'UPDATE services SET is_active = false WHERE id = $1',
        [serviceId]
      );

      console.log('=== SERVICE DEACTIVATED ===');
      console.log('Service ID:', serviceId);
      console.log('==========================');

      return res.status(200).json({
        success: true,
        message: 'Service deactivated successfully'
      });
    } catch (error) {
      console.error('Error deactivating service:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}