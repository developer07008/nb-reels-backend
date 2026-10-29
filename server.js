/**
 * ==============================================================================
 * CHAT BOX PRO — SECURE NODE.JS / EXPRESS EMAIL MIDDLEWARE
 * ==============================================================================
 * Dedicated proxy server to securely dispatch branded emails via the Brevo SMTP API.
 * Designed for deployment on Render.com, Railway, VPS, or any Node.js cloud platform.
 *
 * Separation of Concerns:
 * - This server ONLY handles email forwarding via Brevo.
 * - Database and authentication session handling remain on the client/Firebase.
 * - Solves mobile dynamic IP blocking and keeps the Brevo API key secret.
 *
 * Powered & Secured by: D 4K Studio Private Limited
 * Lead Developer: Danish Raja Ji (Naya Basti, Bokaro Thermal, Jharkhand, India)
 * Official Website: https://mr4k09.000.pe | Phone: +91 9430320021
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration (Environment variables with sensible fallbacks)
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = process.env.SENDER_NAME || 'Chat Box Pro';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@mr4k09.000.pe';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-App']
}));
app.use(express.json());

// In-Memory OTP Store (10-minute validity)
const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Rate limiter per identifier (max 5 requests per minute)
const rateLimitMap = new Map();
function checkRateLimit(identifier) {
  const now = Date.now();
  const history = rateLimitMap.get(identifier) || [];
  const recent = history.filter(ts => now - ts < 60 * 1000);
  if (recent.length >= 6) return false;
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return true;
}

// ==============================================================================
// 1. HTML / CSS EMAIL TEMPLATES (MATCHING SCREENSHOTS EXACTLY)
// ==============================================================================

/**
 * OTP Verification Email Template
 * Pixel-for-pixel match to the official D 4K Studio Private Limited screenshots.
 */
function getOtpEmailHtml({ recipientEmail, otpCode, recipientName = '', appName = 'Chat Box Pro' }) {
  const displayName = recipientName || (recipientEmail ? recipientEmail.split('@')[0] : 'User');
  const formattedOtp = String(otpCode).trim().split('').join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔐 [${otpCode}] Official Verification Code — D 4K Studio Private Limited</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #cbd5e1;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Gold Line Accent -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);"></td>
          </tr>

          <!-- Header Banner (Dark Blue Gradient) -->
          <tr>
            <td style="background: linear-gradient(180deg, #0b1426 0%, #111e38 100%); padding: 36px 28px; text-align: center;">
              <div style="display: inline-block; border: 1px solid #f59e0b; background-color: rgba(245, 158, 11, 0.12); color: #fbbf24; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px;">
                &#10004; OFFICIAL VERIFIED SECURITY
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">
                D 4K Studio Private Limited
              </h1>
              <p style="color: #94a3b8; font-size: 13px; font-weight: 500; margin: 0; letter-spacing: 0.2px;">
                Secure Identity &amp; Cloud Verification Service
              </p>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <p style="font-size: 16px; margin: 0 0 14px 0; color: #0f172a;">
                Hello <span style="color: #2563eb; font-weight: 700;">${displayName}</span>,
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 20px 0;">
                A secure verification request was initiated for your account on <strong>D 4K Studio Private Limited</strong>. Please use the confidential verification details below to complete your <strong>Developer Console Registration for "${appName}"</strong>:
              </p>

              <!-- Light Blue Callout Notice Box -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-bottom: 26px;">
                <p style="font-size: 13px; line-height: 19px; color: #1e40af; margin: 0;">
                  Once verified, your project "${appName}" will be activated as your custom Automatic Email Sender Name for all your app users.
                </p>
              </div>

              <!-- Passcode Box (Rounded Rect with Dark Code Display) -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 16px; text-align: center; margin-bottom: 26px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
                  ONE-TIME SECURITY PASSCODE (TAP CODE TO COPY)
                </div>
                <div style="background-color: #0b1426; border-radius: 12px; padding: 14px 24px; display: inline-block; margin: 0 auto 12px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  <span style="color: #fbbf24; font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; display: inline-block; vertical-align: middle;">
                    ${formattedOtp}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #2563eb;">
                  &#9201; Valid for 10 Minutes &bull; Single-Use Only
                </div>
              </div>

              <!-- Security Information Bullet Box (Blue Left Border) -->
              <div style="border-left: 4px solid #3b82f6; background-color: #f8fafc; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 20px;">
                <ul style="margin: 0; padding-left: 14px; font-size: 13px; color: #334155; line-height: 22px;">
                  <li><strong>Service / Application:</strong> D 4K Studio Private Limited</li>
                  <li><strong>Action Requested:</strong> Developer Console Registration for "${appName}"</li>
                  <li><strong>Security Standard:</strong> 256-Bit SSL &amp; TiDB Cloud Encrypted</li>
                </ul>
              </div>

              <!-- Security Notice -->
              <p style="font-size: 13px; line-height: 19px; color: #64748b; margin: 0 0 8px 0;">
                &#128274; <strong>Security Notice:</strong> This verification is valid for <strong>10 minutes</strong>. Never share this code or link with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer Area (Dark Background Matching Screenshots) -->
          <tr>
            <td style="background-color: #0b1426; padding: 26px 28px; text-align: center; border-top: 1px solid #1e293b;">
              <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; border-radius: 6px; padding: 6px 14px; margin-bottom: 12px;">
                <span style="color: #60a5fa; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                  &#9889; POWERED &amp; SECURED BY D 4K STUDIO PRIVATE LIMITED
                </span>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">
                Lead Developer: <strong style="color: #f1f5f9;">Danish Raja Ji</strong>
              </p>
              <p style="color: #64748b; font-size: 11px; margin: 0 0 16px 0;">
                Headquarters: Naya Basti, Bokaro Thermal, Jharkhand, India
              </p>

              <!-- Two Action Buttons (Official Website & Phone) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://mr4k09.000.pe" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 6px; display: inline-block;">
                      Official Website
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="tel:+919430320021" style="background-color: #1e293b; color: #fbbf24; border: 1px solid #334155; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 6px; display: inline-block;">
                      +91 9430320021
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #475569; font-size: 10px; margin: 0;">
                &copy; 2026 D 4K Studio Private Limited. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Welcome Email Template
 * Adapted with the same premium design language and Chat Box Pro / D 4K Studio branding.
 */
function getWelcomeEmailHtml({ recipientEmail, recipientName = '', avatarUrl = '', appName = 'Chat Box Pro' }) {
  const displayName = recipientName || (recipientEmail ? recipientEmail.split('@')[0] : 'User');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>✨ Welcome to ${appName} — Official Account Activated</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #cbd5e1;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Emerald Bar Accent -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #10b981, #25D366, #059669);"></td>
          </tr>

          <!-- Header Banner (Dark Blue Gradient) -->
          <tr>
            <td style="background: linear-gradient(180deg, #0b1426 0%, #111e38 100%); padding: 36px 28px; text-align: center;">
              <div style="display: inline-block; border: 1px solid #25D366; background-color: rgba(37, 211, 102, 0.15); color: #25D366; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px;">
                &#9733; OFFICIAL VERIFIED ACCOUNT
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">
                Welcome to ${appName}
              </h1>
              <p style="color: #94a3b8; font-size: 13px; font-weight: 500; margin: 0; letter-spacing: 0.2px;">
                Next-Generation Encrypted Realtime Messenger &bull; D 4K Studio Private Limited
              </p>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <p style="font-size: 18px; margin: 0 0 14px 0; color: #0f172a; font-weight: 700;">
                Hello <span style="color: #059669;">${displayName}</span>,
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 20px 0;">
                Congratulations! Your profile setup for <strong>${appName}</strong> is now complete, your Profile DP has been secured via encrypted Supabase cloud storage, and your account is active on our real-time network.
              </p>

              <!-- Pro Capabilities Box -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; color: #166534; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                  &#128640; INCLUDED PRO CAPABILITIES
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #15803d; line-height: 24px;">
                  <li><strong>End-to-End Encryption:</strong> Zero third-party surveillance on chats &amp; media.</li>
                  <li><strong>VoIP HD Voice &amp; Video Calling:</strong> Ultra low-latency crystal clear calls.</li>
                  <li><strong>24-Hour Stories &amp; Status:</strong> Ephemeral visual updates with privacy filters.</li>
                  <li><strong>Offline APK Self-Extraction:</strong> Export &amp; distribute ${appName} via Bluetooth or WhatsApp.</li>
                  <li><strong>11-Language Global Switcher:</strong> Instant real-time localization.</li>
                </ul>
              </div>

              <!-- Account Metadata Details -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                <table width="100%" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155;">
                  <tr>
                    <td width="35%" style="color: #64748b; font-weight: 600;">Account Email:</td>
                    <td style="font-weight: 700; color: #0f172a;">${recipientEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Display Name:</td>
                    <td style="font-weight: 700; color: #0f172a;">${displayName}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Security Standard:</td>
                    <td style="color: #059669; font-weight: 700;">256-Bit SSL &amp; Cloud E2EE Encrypted</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 13px; line-height: 19px; color: #64748b; margin: 0 0 16px 0;">
                You can manage your biometrics, App Lock PIN, and privacy settings anytime within the app.
              </p>
            </td>
          </tr>

          <!-- Footer Area Matching Screenshots -->
          <tr>
            <td style="background-color: #0b1426; padding: 26px 28px; text-align: center; border-top: 1px solid #1e293b;">
              <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; border-radius: 6px; padding: 6px 14px; margin-bottom: 12px;">
                <span style="color: #60a5fa; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                  &#9889; POWERED &amp; SECURED BY D 4K STUDIO PRIVATE LIMITED
                </span>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">
                Lead Developer: <strong style="color: #f1f5f9;">Danish Raja Ji</strong>
              </p>
              <p style="color: #64748b; font-size: 11px; margin: 0 0 16px 0;">
                Headquarters: Naya Basti, Bokaro Thermal, Jharkhand, India
              </p>

              <!-- Two Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://mr4k09.000.pe" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 6px; display: inline-block;">
                      Official Website
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="tel:+919430320021" style="background-color: #1e293b; color: #fbbf24; border: 1px solid #334155; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 6px; display: inline-block;">
                      +91 9430320021
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #475569; font-size: 10px; margin: 0;">
                &copy; 2026 D 4K Studio Private Limited. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==============================================================================
// 2. BREVO SMTP API DISPATCH HELPER
// ==============================================================================

async function sendBrevoEmail({ recipientEmail, recipientName, subject, htmlContent }) {
  if (!BREVO_API_KEY || BREVO_API_KEY === 'my_brevo_api_key_placeholder') {
    console.warn('[Proxy Warning] BREVO_API_KEY is unset or dummy placeholder. Simulating successful dispatch.');
    return {
      success: true,
      simulated: true,
      message: 'Email dispatch simulated locally (set BREVO_API_KEY in environment variables for live delivery).'
    };
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [
      {
        email: recipientEmail,
        name: recipientName || recipientEmail.split('@')[0]
      }
    ],
    subject,
    htmlContent
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ChatBoxPro-NodeMiddleware/1.2.0'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = { raw: responseText };
  }

  if (!response.ok) {
    const errorMsg = json?.message || `Brevo HTTP Error ${response.status}`;
    console.error(`[Brevo API Error ${response.status}]:`, responseText);
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = json;
    throw err;
  }

  return {
    success: true,
    messageId: json?.messageId,
    data: json
  };
}

// ==============================================================================
// 3. EXPRESS REST API ENDPOINTS
// ==============================================================================

/**
 * Health Check & Service Banner
 */
app.get(['/', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chat Box Pro - Secure Node.js Email Middleware',
    version: '1.2.0',
    platform: 'Render.com',
    company: 'D 4K Studio Private Limited',
    leadDeveloper: 'Danish Raja Ji',
    brevoKeyConfigured: Boolean(BREVO_API_KEY && BREVO_API_KEY !== 'my_brevo_api_key_placeholder'),
    sender: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /send-otp
 * Body: { email, name?, appName?, otp? }
 */
app.post(['/send-otp', '/api/send-otp'], async (req, res) => {
  try {
    const { email, name = '', appName = 'Chat Box Pro', otp } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    if (!checkRateLimit(email.toLowerCase().trim())) {
      return res.status(429).json({
        success: false,
        error: 'Too many verification requests. Please wait a minute before retrying.'
      });
    }

    // Generate or use provided 6-digit OTP
    const otpCode = otp ? String(otp).trim() : String(Math.floor(100000 + Math.random() * 900000));

    // Store in active sessions map
    otpStore.set(email.toLowerCase().trim(), {
      otp: otpCode,
      createdAt: Date.now()
    });

    const htmlContent = getOtpEmailHtml({
      recipientEmail: email,
      otpCode,
      recipientName: name,
      appName: appName || 'App User'
    });

    const subject = `🔐 [${otpCode}] Official Verification Code — D 4K Studio Private Limited`;

    const dispatchResult = await sendBrevoEmail({
      recipientEmail: email.trim(),
      recipientName: name,
      subject,
      htmlContent
    });

    console.log(`[OTP Dispatched] Code [${otpCode}] sent to ${email}`);

    res.json({
      success: true,
      message: `Official verification code sent to ${email}`,
      otp: otpCode,
      messageId: dispatchResult.messageId,
      simulated: dispatchResult.simulated || false
    });
  } catch (err) {
    console.error('[send-otp Error]:', err.message);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to dispatch verification email via Brevo.',
      details: err.details || null
    });
  }
});

/**
 * POST /verify-otp
 * Body: { email, otp }
 */
app.post(['/verify-otp', '/api/verify-otp'], (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Both email and otp are required.'
    });
  }

  const key = email.toLowerCase().trim();
  const session = otpStore.get(key);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'No active verification request found. Please request a new code.'
    });
  }

  if (Date.now() - session.createdAt > OTP_EXPIRY_MS) {
    otpStore.delete(key);
    return res.status(410).json({
      success: false,
      error: 'Verification code has expired (10 minutes validity). Please request a new code.'
    });
  }

  if (session.otp === String(otp).trim()) {
    otpStore.delete(key); // single-use only
    return res.json({
      success: true,
      message: 'Passcode verified successfully!'
    });
  }

  res.status(401).json({
    success: false,
    error: 'Incorrect verification code. Please check your email and try again.'
  });
});

/**
 * POST /send-welcome
 * Body: { email, name, avatarUrl?, appName? }
 */
app.post(['/send-welcome', '/api/send-welcome'], async (req, res) => {
  try {
    const { email, name = '', avatarUrl = '', appName = 'Chat Box Pro' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const htmlContent = getWelcomeEmailHtml({
      recipientEmail: email,
      recipientName: name,
      avatarUrl,
      appName
    });

    const subject = `✨ Welcome to ${appName} — Your Account is Ready!`;

    const dispatchResult = await sendBrevoEmail({
      recipientEmail: email.trim(),
      recipientName: name,
      subject,
      htmlContent
    });

    console.log(`[Welcome Dispatched] Welcome email sent to ${email} (${name})`);

    res.json({
      success: true,
      message: `Welcome email successfully sent to ${email}`,
      messageId: dispatchResult.messageId,
      simulated: dispatchResult.simulated || false
    });
  } catch (err) {
    console.error('[send-welcome Error]:', err.message);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to dispatch welcome email via Brevo.',
      details: err.details || null
    });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`🚀 Chat Box Pro — Express Email Middleware Active`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  console.log(`🏢 Powered & Secured by D 4K Studio Private Limited`);
  console.log(`👨‍💻 Lead Developer: Danish Raja Ji`);
  console.log(`========================================================`);
});
