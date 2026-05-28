import nodemailer from 'nodemailer';

/**
 * Sends a provisioning email to a newly created user with their login credentials and role.
 * 
 * Env variables in .env.local:
 * - SMTP_HOST
 * - SMTP_PORT (default 587)
 * - SMTP_USER
 * - SMTP_PASS
 * - SMTP_FROM (default "InsightEd Portal <noreply@insighted.edu>")
 */
export async function sendProvisioningEmail({ email, password, role, firstName, lastName, teacherName, mappedSubject }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  let user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  if (user && user.toLowerCase().trim() === 'contact.talhabilal.com') {
    user = 'contact@talhabilal.com';
  }
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.SMTP_FROM || (user ? `"InsightEd Portal" <${user}>` : '"InsightEd Portal" <noreply@insighted.edu>');

  const subject = `Welcome to InsightEd! Your Account is Ready`;
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  // Dynamic colors for the role badges
  let badgeBgColor, badgeTextColor, badgeBorderColor;
  if (role === 'student') {
    badgeBgColor = 'rgba(45, 212, 191, 0.12)';
    badgeTextColor = '#2dd4bf';
    badgeBorderColor = 'rgba(45, 212, 191, 0.3)';
  } else if (role === 'teacher') {
    badgeBgColor = 'rgba(196, 124, 62, 0.12)';
    badgeTextColor = '#e29755';
    badgeBorderColor = 'rgba(196, 124, 62, 0.3)';
  } else {
    badgeBgColor = 'rgba(251, 191, 36, 0.12)';
    badgeTextColor = '#fbbf24';
    badgeBorderColor = 'rgba(251, 191, 36, 0.3)';
  }

  // Premium styled HTML email matching the dark-navy and copper palette
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to InsightEd</title>
        <style>
          body {
            background-color: #0b0f19;
            color: #f2f2f2;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .wrapper {
            background-color: #0b0f19;
            width: 100%;
            table-layout: fixed;
            padding: 40px 0;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .logo-container {
            text-align: center;
            margin-bottom: 24px;
          }
          .logo-text {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #ffffff;
            font-family: 'Outfit', -apple-system, sans-serif;
            text-decoration: none;
          }
          .logo-text span {
            color: #c47c3e;
          }
          .card {
            background-color: #121c2e;
            border: 1px solid rgba(196, 124, 62, 0.22);
            border-radius: 24px;
            padding: 44px;
            text-align: left;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
          }
          .accent-bar {
            height: 4px;
            background: linear-gradient(90deg, #c47c3e, #d4924e);
            border-radius: 4px 4px 0 0;
            margin: -44px -44px 35px -44px;
          }
          h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 12px;
            letter-spacing: -0.3px;
          }
          .greeting-text {
            color: #f2f2f2;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          p {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .role-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            background-color: ${badgeBgColor};
            color: ${badgeTextColor};
            border: 1px solid ${badgeBorderColor};
            margin-top: 4px;
          }
          .section-title {
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            margin-top: 24px;
          }
          .credentials-box {
            background-color: #090e17;
            border-left: 4px solid #c47c3e;
            border-radius: 12px;
            padding: 22px;
            margin-bottom: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.02);
            border-right: 1px solid rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          }
          .credential-item {
            margin-bottom: 12px;
            font-size: 14px;
            display: table;
            width: 100%;
          }
          .credential-item:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #64748b;
            font-weight: 600;
            display: table-cell;
            width: 90px;
            vertical-align: middle;
          }
          .value {
            color: #ffffff;
            font-weight: 700;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            display: table-cell;
            vertical-align: middle;
            letter-spacing: 0.3px;
          }
          .association-box {
            background-color: rgba(196, 124, 62, 0.05);
            border: 1px dashed rgba(196, 124, 62, 0.25);
            border-radius: 12px;
            padding: 18px 22px;
            margin-bottom: 24px;
          }
          .association-item {
            font-size: 14px;
            margin-bottom: 8px;
          }
          .association-item:last-child {
            margin-bottom: 0;
          }
          .association-label {
            color: rgba(196, 124, 62, 0.75);
            font-weight: 600;
            display: inline-block;
            width: 100px;
          }
          .association-value {
            color: #f2f2f2;
            font-weight: 700;
          }
          .btn-container {
            text-align: center;
            margin: 30px 0 20px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #c47c3e, #d4924e);
            color: #ffffff !important;
            text-decoration: none;
            font-size: 15px;
            font-weight: 800;
            padding: 15px 36px;
            border-radius: 14px;
            box-shadow: 0 8px 20px rgba(196, 124, 62, 0.3);
            transition: all 0.2s ease;
          }
          .security-note {
            font-size: 12px;
            color: #64748b;
            text-align: center;
            margin-top: 24px;
            line-height: 1.5;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            font-size: 11px;
            color: #475569;
            line-height: 1.6;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo-container">
              <span class="logo-text"><span>IN</span>sightEd</span>
            </div>
            <div class="card">
              <div class="accent-bar"></div>
              <h1>Account Provisioned Successfully</h1>
              <div class="greeting-text">Hello ${firstName} ${lastName},</div>
              <p>Your official academic portal access is now ready. You have been configured on the platform with the following role:</p>
              
              <div style="margin-bottom: 24px;">
                <span class="role-badge">${roleDisplay}</span>
              </div>
              
              ${teacherName && mappedSubject ? `
                <div class="section-title">Academic Assignment</div>
                <div class="association-box">
                  <div class="association-item">
                    <span class="association-label">Instructor:</span>
                    <span class="association-value">${teacherName}</span>
                  </div>
                  <div class="association-item">
                    <span class="association-label">Course:</span>
                    <span class="association-value">"${mappedSubject}"</span>
                  </div>
                </div>
              ` : ''}

              <div class="section-title">Security Credentials</div>
              <div class="credentials-box">
                <div class="credential-item">
                  <span class="label">Access Link:</span>
                  <span class="value" style="color: #c47c3e; font-weight: 800;">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login</span>
                </div>
                <div class="credential-item">
                  <span class="label">Username:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="credential-item">
                  <span class="label">Password:</span>
                  <span class="value">${password}</span>
                </div>
              </div>

              <div class="btn-container">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="btn" target="_blank">
                  Enter Your Dashboard
                </a>
              </div>

              <div class="security-note">
                <strong>🔒 Security Recommendation:</strong><br>
                For your account's safety, please change this temporary password from the settings tab immediately upon your first login.
              </div>
            </div>
            <div class="footer">
              This is an automated operational email from the InsightEd Academic Portal.<br>
              &copy; 2026 InsightEd. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to InsightEd!
Hello ${firstName} ${lastName},

Your official academic portal access is now ready.
Role: ${roleDisplay}

${teacherName && mappedSubject ? `Academic Assignment:\n- Instructor: ${teacherName}\n- Course: "${mappedSubject}"\n` : ''}
Security Credentials:
- Access Link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login
- Username: ${email}
- Password: ${password}

Please log in to your dashboard to change your temporary password immediately.
  `.trim();

  // Fallback to console printing if SMTP host is missing
  if (!host || !user || !pass) {
    console.warn(`
=============================================================================
⚠️  [SMTP NOT CONFIGURED] Simulation Mode: Provisioning Email
To enable actual emails, configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local.
-----------------------------------------------------------------------------
TO: ${email} (${firstName} ${lastName})
SUBJECT: ${subject}
ROLE: ${roleDisplay}
PASSWORD: ${password}
${teacherName ? `TEACHER: ${teacherName} | SUBJECT: ${mappedSubject}` : ''}
=============================================================================
    `);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Email successfully sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email via SMTP transporter:', error);
    return { success: false, error: error.message };
  }
}

