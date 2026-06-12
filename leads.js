const express = require("express");
const db = require("../db");

const router = express.Router();

// POST /api/leads — dentist practice signup / "request an audit" form
router.post("/", (req, res) => {
  const {
    practiceName,
    contactName,
    email,
    phone,
    address,
    interest,
    message,
  } = req.body || {};

  if (!practiceName || !contactName || !email || !phone) {
    return res
      .status(400)
      .json({ error: "practiceName, contactName, email, and phone are required" });
  }

  const lead = db.addLead({
    practiceName,
    contactName,
    email,
    phone,
    address: address || "",
    interest: interest || "",
    message: message || "",
  });

  res.status(201).json({ ok: true, lead });
});

// GET /api/leads — simple admin listing
router.get("/", (req, res) => {
  res.json({ results: db.getAllLeads() });
});

module.exports = router;
