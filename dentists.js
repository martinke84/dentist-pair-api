const express = require("express");
const db = require("../db");
const { lookupZip, distanceMiles } = require("../geo");

const router = express.Router();

const DEFAULT_RADIUS = Number(process.env.DEFAULT_SEARCH_RADIUS_MILES) || 15;

// GET /api/dentists?zip=30301&radius=15&specialty=Pediatric
router.get("/", (req, res) => {
  const { zip, radius, specialty } = req.query;
  let dentists = db.getAllDentists();

  if (specialty) {
    dentists = dentists.filter((d) =>
      (d.specialties || []).some(
        (s) => s.toLowerCase() === String(specialty).toLowerCase()
      )
    );
  }

  if (zip) {
    const origin = lookupZip(zip);
    if (!origin) {
      return res.status(400).json({ error: `Unrecognized zip code: ${zip}` });
    }

    const radiusMiles = radius ? Number(radius) : DEFAULT_RADIUS;

    dentists = dentists
      .filter((d) => typeof d.lat === "number" && typeof d.lng === "number")
      .map((d) => ({
        ...d,
        distanceMiles: Number(
          distanceMiles(origin.latitude, origin.longitude, d.lat, d.lng).toFixed(1)
        ),
      }))
      .filter((d) => d.distanceMiles <= radiusMiles)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    return res.json({
      origin: { zip, lat: origin.latitude, lng: origin.longitude, city: origin.city, state: origin.state },
      radiusMiles,
      results: dentists,
    });
  }

  // No zip provided — just return everything (e.g. for an admin view)
  res.json({ results: dentists });
});

// GET /api/dentists/:id
router.get("/:id", (req, res) => {
  const dentist = db.getDentistById(req.params.id);
  if (!dentist) return res.status(404).json({ error: "Dentist not found" });
  res.json(dentist);
});

// POST /api/dentists  (basic admin/create endpoint)
router.post("/", (req, res) => {
  const { name, address, zip, phone, specialties, hours } = req.body || {};
  if (!name || !address || !zip) {
    return res.status(400).json({ error: "name, address, and zip are required" });
  }

  const location = lookupZip(zip);
  if (!location) {
    return res.status(400).json({ error: `Unrecognized zip code: ${zip}` });
  }

  const dentist = db.addDentist({
    name,
    address,
    zip,
    city: location.city,
    state: location.state,
    lat: location.latitude,
    lng: location.longitude,
    phone: phone || "",
    specialties: Array.isArray(specialties) ? specialties : [],
    hours: hours || "",
    bookingUrl: req.body.bookingUrl || "",
    acceptingNewPatients: req.body.acceptingNewPatients !== false,
  });

  res.status(201).json(dentist);
});

module.exports = router;
