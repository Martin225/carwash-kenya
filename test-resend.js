const { Resend } = require('resend');

// REPLACE THIS WITH YOUR ACTUAL API KEY!
const resend = new Resend('re_2R9REyyj_HkEuuDnXvKdoT4X7kAfx2yW1');

async function sendTestEmail() {
  console.log('Testing Resend...');
  
  try {
    const data = await resend.emails.send({
      from: 'CarWash Pro <onboarding@resend.dev>',
      to: ['support@natsautomations.co.ke'], // YOUR EMAIL
      subject: 'Test from CarWash Pro',
      html: '<h1>Success! 🎉</h1><p>Resend is working!</p>'
    });

    console.log('✅ SUCCESS! Email sent!');
    console.log('Email ID:', data.id);
    console.log('Check your inbox:', 'nats.electric@gmail.com');
  } catch (error) {
    console.log('❌ ERROR:');
    console.log(error);
  }
}

sendTestEmail();