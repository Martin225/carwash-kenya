import axios from 'axios';

export async function sendSMS(phoneNumber, message) {
  // Format phone number first
  let formattedPhone = phoneNumber.toString().trim();
  if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

  console.log('=== SENDING SMS TO:', formattedPhone, '===');

  // Try TextSMS Kenya first
  try {
    const partnerId = process.env.TEXTSMS_PARTNER_ID;
    const apiKey = process.env.TEXTSMS_API_KEY;
    const senderId = process.env.TEXTSMS_SENDER_ID || 'TextSMS';

    if (partnerId && apiKey) {
      console.log('📱 Trying TextSMS Kenya...');
      
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
          timeout: 10000
        }
      );

      if (response.data?.responses?.[0]?.['response-code'] === 200) {
        console.log('✅ TextSMS sent successfully!');
        return { success: true, provider: 'textsms', result: response.data };
      }
      
      console.log('⚠️ TextSMS failed, trying Africa\'s Talking...');
    }
  } catch (textSmsError) {
    console.log('⚠️ TextSMS error:', textSmsError.message, '- trying Africa\'s Talking...');
  }

  // Fallback: Try Africa's Talking
  try {
    const atUsername = process.env.AFRICASTALKING_USERNAME;
    const atApiKey = process.env.AFRICASTALKING_API_KEY;

    if (atUsername && atApiKey) {
      console.log('📱 Trying Africa\'s Talking...');

      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: atUsername,
          to: '+' + formattedPhone,
          message: message
        }),
        {
          headers: {
            'apikey': atApiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const recipient = response.data?.SMSMessageData?.Recipients?.[0];
      if (recipient?.status === 'Success') {
        console.log('✅ Africa\'s Talking SMS sent successfully!');
        return { success: true, provider: 'africastalking', result: response.data };
      }

      console.log('⚠️ Africa\'s Talking response:', JSON.stringify(response.data));
    }
  } catch (atError) {
    console.log('⚠️ Africa\'s Talking error:', atError.message);
  }

  // Both failed
  console.error('❌ All SMS providers failed!');
  return { success: false, error: 'All SMS providers failed' };
}
```

**Save and close**

---

## 🔧 **ADD AFRICA'S TALKING TO VERCEL ENV:**

Go to **Vercel → Settings → Environment Variables** and add:
```
AFRICASTALKING_USERNAME = Mkamau
AFRICASTALKING_API_KEY = atsk_9e9749c5247df597dac29c3c82674d186df436954dcb8407a79ffe0808d7ce0e39e60d4b