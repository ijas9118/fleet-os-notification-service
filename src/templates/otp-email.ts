/**
 * Generate OTP email HTML template
 *
 * @param otp - 6-digit OTP code
 * @param type - Registration type (user or tenant)
 * @param expiresInMinutes - Minutes until OTP expires (default: 5)
 * @returns HTML email template
 */
export function generateOtpEmailTemplate(
  otp: string,
  type: "user" | "tenant",
  expiresInMinutes: number = 5,
): string {
  const title = type === "user" ? "User Registration" : "Organization Registration";
  const description = type === "user"
    ? "Complete your user registration"
    : "Complete your organization registration";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FleetOS - ${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }
    .description {
      font-size: 16px;
      color: #666;
      margin-bottom: 30px;
    }
    .otp-container {
      background-color: #f8f9fa;
      border: 2px dashed #0066cc;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: bold;
      color: #0066cc;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
    }
    .expiry-info {
      font-size: 14px;
      color: #999;
      margin-top: 15px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-text {
      font-size: 14px;
      color: #856404;
      margin: 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .help-text {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🚚 FleetOS</div>
      <h1 class="title">${title}</h1>
      <p class="description">${description}</p>
    </div>

    <div class="otp-container">
      <div class="otp-label">Your OTP Code</div>
      <div class="otp-code">${otp}</div>
      <div class="expiry-info">⏱️ Valid for ${expiresInMinutes} minutes</div>
    </div>

    <div class="warning">
      <p class="warning-text">
        <strong>⚠️ Security Notice:</strong> Never share this code with anyone. 
        FleetOS staff will never ask for your OTP code.
      </p>
    </div>

    <div class="help-text">
      <p>If you didn't request this code, please ignore this email. The code will expire automatically.</p>
      <p>Having trouble? Contact our support team at <a href="mailto:support@fleetos.com">support@fleetos.com</a></p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} FleetOS. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of OTP email (fallback)
 */
export function generateOtpEmailText(
  otp: string,
  type: "user" | "tenant",
  expiresInMinutes: number = 5,
): string {
  const title = type === "user" ? "User Registration" : "Organization Registration";

  return `
FleetOS - ${title}

Your OTP Code: ${otp}

This code is valid for ${expiresInMinutes} minutes.

Security Notice: Never share this code with anyone. FleetOS staff will never ask for your OTP code.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} FleetOS. All rights reserved.
  `.trim();
}
