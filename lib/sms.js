import axios from 'axios';

export async function sendSMS(phoneNumber, message) {
  try {
    const partnerId = process.env.TEXTSMS_PARTNER_ID;
    const apiKey = process.env.TEXTSMS_API_KEY;
    const senderId = process.env.TEXTSMS_SENDER_ID || 'TextSMS';

    console.log('=== TEXTSMS CREDENTIALS ===');
    console.log('Partner ID:', partnerId);
    console.log('API Key:', apiKey ? 'EXISTS' : 'MISSING');
    console.log('Sender ID:', senderId);
    console.log('===========================');

    if (!partnerId || !apiKey) {
      console.log('⚠️ SMS credentials missing - skipping');
      return { success: false, error: 'SMS not configured' };
    }

    // Format phone number
    let formattedPhone = phoneNumber.toString().trim();
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    console.log('=== SENDING SMS ===');
    console.log('To:', formattedPhone);
    console.log('Message:', message);
    console.log('===================');

    const response = await axios.post(
'https://sms.textsms.co.ke/api/services/sendsms/',

      {
        apikey: apiKey,
        partnerID: partnerId,
        message: message,
        shortcode: senderId,
        mobile: formattedPhone
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    console.log('=== SMS RESPONSE ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('===================');

    // TextSMS returns responses_code 200 on success
    if (response.data && response.data.responses) {
  const resp = response.data.responses[0];
  // TextSMS uses 'response-code' with hyphen, not underscore!
  const responseCode = resp['response-code'];
  const responseDesc = resp['response-description'];
  
  if (responseCode === 200) {
    console.log('✅ SMS sent successfully!');
    console.log('Message ID:', resp.messageid);
    return { success: true, result: response.data };
  } else {
    console.error('❌ SMS failed:', responseDesc);
    return { success: false, error: responseDesc };
  }
}

    return { success: true, result: response.data };

  } catch (error) {
    console.error('=== SMS ERROR ===');
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('=================');
    return { success: false, error: error.message };
  }
}