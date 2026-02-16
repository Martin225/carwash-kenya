import axios from 'axios';

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';

const BASE_URL = process.env.MPESA_ENVIRONMENT === 'production' ? PRODUCTION_URL : SANDBOX_URL;

// Get OAuth access token
export async function getAccessToken() {
  console.log('=== GET ACCESS TOKEN START ===');
  
  try {
    // Check if axios exists
    console.log('Axios available:', typeof axios);
    
    // Check environment variables
    console.log('Raw Consumer Key:', process.env.MPESA_CONSUMER_KEY ? 'EXISTS' : 'UNDEFINED!');
    console.log('Raw Consumer Secret:', process.env.MPESA_CONSUMER_SECRET ? 'EXISTS' : 'UNDEFINED!');
    console.log('BASE_URL:', BASE_URL);
    
    // Trim whitespace from credentials
    const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
    const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();

    console.log('Consumer Key length:', consumerKey.length);
    console.log('Consumer Secret length:', consumerSecret.length);

    // Verify credentials exist
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not found in environment variables');
    }

    console.log('Consumer Key (first 10 chars):', consumerKey.substring(0, 10) + '...');
    console.log('Consumer Secret (first 10 chars):', consumerSecret.substring(0, 10) + '...');

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log('Auth created, length:', auth.length);

    const url = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
    console.log('Request URL:', url);

    console.log('Making axios request...');
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    console.log('=== TOKEN SUCCESS ===');
    console.log('Access Token received!');
    console.log('====================');

    return response.data.access_token;
  } catch (error) {
    console.error('=== M-PESA TOKEN ERROR DETAILS ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Has response?', !!error.response);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config?.url);
    } else if (error.request) {
      console.error('Request made but no response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('==================================');
    
    throw new Error(`Failed to get M-Pesa access token: ${error.message}`);
  }
}
// Generate timestamp for STK Push
export function getTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password for STK Push
export function generatePassword(timestamp) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  return password;
}

// Initiate STK Push (Lipa Na M-Pesa Online)
export async function initiateSTKPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Format phone number (remove + or leading 0, ensure 254 prefix)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Must be integer
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
      AccountReference: accountReference || 'CarWashPro',
      TransactionDesc: transactionDesc || 'Payment for CarWash Pro subscription'
    };

    console.log('=== M-PESA STK PUSH REQUEST ===');
    console.log('Phone:', formattedPhone);
    console.log('Amount:', amount);
    console.log('Account Ref:', accountReference);
    console.log('==============================');

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('=== M-PESA RESPONSE ===');
    console.log('Response:', response.data);
    console.log('======================');

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('=== M-PESA ERROR ===');
    console.error('Error:', error.response?.data || error.message);
    console.error('===================');
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Query STK Push status
export async function querySTKPushStatus(checkoutRequestID) {
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    };

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('M-Pesa Query Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}