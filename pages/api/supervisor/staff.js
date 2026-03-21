import bcrypt from 'bcryptjs';
import { query, querySingle } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;
      
      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(200).json({ success: true, staff: [] });
      }

      const branchId = branches[0].id;

      const staff = await query(
        'SELECT * FROM staff WHERE branch_id = $1 ORDER BY is_active DESC, full_name',
        [branchId]
      );

      return res.status(200).json({ success: true, staff });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fullName, phone, pinCode, commission, businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ success: false, message: 'Business ID required' });
      }

      const branches = await query(
        'SELECT id FROM branches WHERE business_id = $1 LIMIT 1',
        [businessId]
      );

      if (branches.length === 0) {
        return res.status(400).json({ success: false, message: 'No branch found for this business' });
      }

      const branchId = branches[0].id;

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pinCode, 10);

      // FIX: Use correct field name and default value
      const commissionValue = parseFloat(commission) || 10; // Default 10% not 50

      const newStaff = await querySingle(
        `INSERT INTO staff (branch_id, full_name, phone_number, pin_code, role, commission_percentage, is_active)
         VALUES ($1, $2, $3, $4, 'washer', $5, true)
         RETURNING *`,
        [branchId, fullName, phone, hashedPin, commissionValue]
      );

      console.log('=== NEW STAFF ADDED ===');
      console.log('Name:', fullName);
      console.log('Phone:', phone);
      console.log('Commission:', commissionValue + '%');
      console.log('======================');

      return res.status(201).json({ success: true, staff: newStaff });
    } catch (error) {
      console.error('Create staff error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { staffId, fullName, phone, commission, isActive, pinCode } = req.body;

      if (!staffId) {
        return res.status(400).json({ success: false, message: 'Staff ID required' });
      }

      // Build dynamic update query based on what fields are provided
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (fullName !== undefined) {
        updates.push(`full_name = $${paramIndex}`);
        values.push(fullName);
        paramIndex++;
      }

      if (phone !== undefined) {
        updates.push(`phone_number = $${paramIndex}`);
        values.push(phone);
        paramIndex++;
      }

      if (commission !== undefined) {
        updates.push(`commission_percentage = $${paramIndex}`);
        values.push(parseFloat(commission));
        paramIndex++;
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(isActive);
        paramIndex++;
      }

      // If PIN is provided, hash it and update
      if (pinCode !== undefined && pinCode !== '') {
        const hashedPin = await bcrypt.hash(pinCode, 10);
        updates.push(`pin_code = $${paramIndex}`);
        values.push(hashedPin);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      // Add staffId as the last parameter
      values.push(staffId);

      const updateQuery = `
        UPDATE staff 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const updatedStaff = await querySingle(updateQuery, values);

      console.log('=== STAFF UPDATED ===');
      console.log('Staff ID:', staffId);
      console.log('Updates:', updates.join(', '));
      console.log('====================');

      return res.status(200).json({ 
        success: true, 
        staff: updatedStaff,
        message: 'Staff updated successfully'
      });
    } catch (error) {
      console.error('Update staff error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { staffId } = req.body;

      if (!staffId) {
        return res.status(400).json({ success: false, message: 'Staff ID required' });
      }

      // Check if staff has any bookings or commission records
      const bookingsCount = await query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE assigned_staff_id = $1 OR id IN (
           SELECT booking_id FROM booking_staff WHERE staff_id = $1
         )`,
        [staffId]
      );

      const commissionCount = await query(
        'SELECT COUNT(*) as count FROM commission_payments WHERE staff_id = $1',
        [staffId]
      );

      const hasBookings = parseInt(bookingsCount[0]?.count || 0) > 0;
      const hasCommissions = parseInt(commissionCount[0]?.count || 0) > 0;

      if (hasBookings || hasCommissions) {
        // Staff has records - soft delete (deactivate) instead
        await query(
          'UPDATE staff SET is_active = false, updated_at = NOW() WHERE id = $1',
          [staffId]
        );

        console.log('=== STAFF DEACTIVATED (HAS RECORDS) ===');
        console.log('Staff ID:', staffId);
        console.log('Bookings:', bookingsCount[0]?.count || 0);
        console.log('Commissions:', commissionCount[0]?.count || 0);
        console.log('=======================================');

        return res.status(200).json({
          success: true,
          message: 'Staff deactivated (has booking/commission history)',
          deactivated: true
        });
      } else {
        // No records - safe to permanently delete
        await query('DELETE FROM staff WHERE id = $1', [staffId]);

        console.log('=== STAFF DELETED PERMANENTLY ===');
        console.log('Staff ID:', staffId);
        console.log('=================================');

        return res.status(200).json({
          success: true,
          message: 'Staff deleted permanently',
          deleted: true
        });
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete staff'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}