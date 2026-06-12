const express = require("express");
const db = require("../db");
const { sendSMS, bookingMessage } = require("../sms");

const router = express.Router();

// Very basic E.164-ish phone validation/normalization for US numbers.
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (String(raw).startsWith("+")) return raw;
  return null;
}

// POST /api/booking-requests  { dentistId, phone }
router.post("/", async (req, res) => {
  const { dentistId, phone } = req.body || {};
  if (!dentistId || !phone) {
    return res.status(400).json({ error: "dentistId and phone are required" });
  }

  const dentist = db.getDentistById(dentistId);
  if (!dentist) return res.status(404).json({ error: "Dentist not found" });

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ error: "Please enter a valid phone number" });
  }

  const message = bookingMessage(dentist);
  const smsResult = await sendSMS(normalizedPhone, message);

  const record = db.addBookingRequest({
    dentistId: dentist.id,
    dentistName: dentist.name,
    phone: normalizedPhone,
    smsSent: smsResult.sent,
    smsDryRun: Boolean(smsResult.dryRun),
  });

  res.status(201).json({
    ok: true,
    request: record,
    sms: smsResult,
  });
});

module.exports = router;
