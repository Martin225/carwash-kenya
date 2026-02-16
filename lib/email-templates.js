export function getVerificationEmail(ownerName, businessName, verificationLink) {
  return {
    subject: `Verify your CarWash Pro account - ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #006633 0%, #004d26 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #006633; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚗 CarWash Pro Kenya</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to Professional Carwash Management</p>
    </div>
    <div class="content">
      <h2 style="color: #006633;">Hello ${ownerName}! 👋</h2>
      <p>Thank you for registering <strong>${businessName}</strong> with CarWash Pro Kenya!</p>
      
      <p>To complete your registration and start your <strong>30-day FREE trial</strong>, please verify your email address:</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">✓ Verify Email Address</a>
      </div>
      
      <p style="font-size: 0.9rem; color: #666; margin-top: 20px;">
        Or copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #006633;">${verificationLink}</span>
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <h3 style="color: #006633;">What happens next?</h3>
      <ul>
        <li>✅ Our admin will review your application (usually within 24 hours)</li>
        <li>🎁 Once approved, your 30-day FREE trial starts automatically</li>
        <li>📧 You'll receive a confirmation email when approved</li>
        <li>🚀 Start managing your carwash professionally!</li>
      </ul>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <strong style="color: #006633;">💰 Pricing after trial:</strong><br>
        Only Kshs 2,000/month - Cancel anytime!
      </div>
    </div>
    <div class="footer">
      <p><strong>CarWash Pro Kenya</strong></p>
      <p>📞 +254 726 259 977 | 📧 support@smartwash.natsautomations.co.ke</p>
      <p>🌐 www.natsautomations.co.ke</p>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;">
        If you didn't create this account, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Hello ${ownerName}!

Thank you for registering ${businessName} with CarWash Pro Kenya!

To complete your registration and start your 30-day FREE trial, please verify your email address by clicking this link:

${verificationLink}

What happens next?
- Our admin will review your application (usually within 24 hours)
- Once approved, your 30-day FREE trial starts automatically
- You'll receive a confirmation email when approved
- Start managing your carwash professionally!

Pricing after trial: Only Kshs 2,000/month - Cancel anytime!

If you didn't create this account, please ignore this email.

CarWash Pro Kenya
📞 +254 726 259 977
📧 support@smartwash.natsautomations.co.ke
🌐 www.natsautomations.co.ke
    `
  };
}

export function getApprovalEmail(ownerName, businessName, loginLink, trialEndsDate) {
  return {
    subject: `🎉 ${businessName} - Your FREE Trial is Active!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #006633 0%, #004d26 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #FCD116; color: #006633; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 Congratulations ${ownerName}!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been approved!</p>
    </div>
    <div class="content">
      <p><strong>${businessName}</strong> is now active on CarWash Pro Kenya!</p>
      
      <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h2 style="color: #006633; margin: 0;">🎁 30-Day FREE Trial Active</h2>
        <p style="margin: 10px 0 0 0;">Trial ends: <strong>${trialEndsDate}</strong></p>
      </div>
      
      <p>You can now login and start managing your carwash:</p>
      
      <div style="text-align: center;">
        <a href="${loginLink}" class="button">🚀 Login to Dashboard</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <h3 style="color: #006633;">Quick Start Guide:</h3>
      <ol>
        <li>Login to your owner dashboard</li>
        <li>Add supervisors to help manage operations</li>
        <li>Supervisors can add staff members</li>
        <li>Start accepting walk-in customers</li>
        <li>Track inventory and revenue in real-time</li>
      </ol>
      
      <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <strong>💡 Need Help?</strong><br>
        Contact us anytime:<br>
        📞 +254 726 259 977<br>
        📧 support@smartwash.natsautomations.co.ke
      </div>
    </div>
    <div class="footer">
      <p><strong>CarWash Pro Kenya</strong></p>
      <p>Professional Carwash Management System</p>
    </div>
  </div>
</body>
</html>
    `
  };
}