import { query, querySingle } from './db';

// Check if restrictions are globally enabled
export async function areRestrictionsEnabled() {
  try {
    const setting = await querySingle(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'restrictions_enabled'"
    );
    return setting?.setting_value === 'true';
  } catch (error) {
    console.error('Error checking restrictions:', error);
    return false; // Default to OFF if there's an error
  }
}

// Get plan limits for a business
export async function getPlanLimits(businessId) {
  try {
    const business = await querySingle(
      'SELECT subscription_plan FROM businesses WHERE id = $1',
      [businessId]
    );

    if (!business) {
      return null;
    }

    const limits = await querySingle(
      'SELECT * FROM plan_limits WHERE plan_name = $1',
      [business.subscription_plan || 'basic']
    );

    return limits;
  } catch (error) {
    console.error('Error getting plan limits:', error);
    return null;
  }
}

// Get current usage counts
export async function getCurrentUsage(businessId) {
  try {
    const [branchCount] = await query(
      'SELECT COUNT(*) as count FROM branches WHERE business_id = $1',
      [businessId]
    );

    const [supervisorCount] = await query(
      'SELECT COUNT(*) as count FROM users WHERE business_id = $1 AND role = $2',
      [businessId, 'supervisor']
    );

    const [staffCount] = await query(
      `SELECT COUNT(*) as count FROM staff s
       JOIN branches b ON s.branch_id = b.id
       WHERE b.business_id = $1`,
      [businessId]
    );

    return {
      branches: parseInt(branchCount?.count || 0),
      supervisors: parseInt(supervisorCount?.count || 0),
      staff: parseInt(staffCount?.count || 0)
    };
  } catch (error) {
    console.error('Error getting usage:', error);
    return { branches: 0, supervisors: 0, staff: 0 };
  }
}

// Main restriction checker
export async function checkRestriction(businessId, resourceType) {
  // Check if restrictions are enabled globally
  const enabled = await areRestrictionsEnabled();
  
  if (!enabled) {
    return {
      allowed: true,
      reason: 'Restrictions disabled',
      current: 0,
      limit: 0,
      plan: 'unlimited'
    };
  }

  const limits = await getPlanLimits(businessId);
  const usage = await getCurrentUsage(businessId);

  if (!limits) {
    return {
      allowed: true,
      reason: 'No limits found',
      current: 0,
      limit: 0,
      plan: 'unlimited'
    };
  }

  let allowed = true;
  let current = 0;
  let limit = 0;

  switch (resourceType) {
    case 'branch':
      current = usage.branches;
      limit = limits.max_branches;
      allowed = current < limit;
      break;

    case 'supervisor':
      current = usage.supervisors;
      limit = limits.max_supervisors;
      allowed = current < limit;
      break;

    case 'staff':
      current = usage.staff;
      limit = limits.max_staff;
      allowed = current < limit;
      break;

    case 'analytics':
      allowed = limits.has_analytics;
      break;

    case 'excel_reports':
      allowed = limits.has_excel_reports;
      break;

    case 'api_access':
      allowed = limits.has_api_access;
      break;

    case 'etims':
      allowed = limits.has_etims;
      break;

    default:
      allowed = true;
  }

  return {
    allowed,
    reason: allowed ? 'Within limits' : `Plan limit reached`,
    current,
    limit,
    plan: limits.plan_name,
    feature: resourceType
  };
}

// Get upgrade recommendation
export function getUpgradeRecommendation(currentPlan, feature) {
  if (currentPlan === 'basic') {
    return {
      recommendedPlan: feature === 'etims' ? 'gold' : 'silver',
      price: feature === 'etims' ? 6000 : 3000
    };
  }
  
  if (currentPlan === 'silver') {
    return {
      recommendedPlan: 'gold',
      price: 6000
    };
  }

  return null;
}