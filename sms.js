// SMS sending via Twilio. Falls back to logging if Twilio env vars
// aren't configured yet, so the rest of the app works during development.

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client = null;
const isConfigured = Boolean(accountSid && authToken && fromNumber);

if (isConfigured) {
  // Lazily require so the app still boots if twilio isn't installed yet.
  const twilio = require("twilio");
  client = twilio(accountSid, authToken);
} else {
  console.warn(
    "[sms] Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER). " +
      "Booking text messages will be logged to the console instead of sent."
  );
}

/**
 * Send an SMS. Returns { sent: boolean, sid?: string, error?: string }.
 */
async function sendSMS(to, body) {
  if (!isConfigured) {
    console.log(`[sms:DRY RUN] To: ${to}\n${body}`);
    return { sent: false, dryRun: true };
  }

  try {
    const message = await client.messages.create({
      to,
      from: fromNumber,
      body,
    });
    return { sent: true, sid: message.sid };
  } catch (err) {
    console.error("[sms] Failed to send SMS:", err.message);
    return { sent: false, error: err.message };
  }
}

function bookingMessage(dentist) {
  const phone = dentist.phone || "the office";
  const bookingUrl = dentist.bookingUrl;
  let msg = `Dentist Pair: To book your appointment with ${dentist.name}, call ${phone}`;
  if (bookingUrl) {
    msg += ` or book online at ${bookingUrl}`;
  }
  msg += `. Address: ${dentist.address}.`;
  if (dentist.hours) {
    msg += ` Hours: ${dentist.hours}.`;
  }
  return msg;
}

module.exports = { sendSMS, bookingMessage, isConfigured };
