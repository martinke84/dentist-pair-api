// Lightweight JSON-file "database".
//
// Why JSON files instead of SQLite/Postgres?
// - Zero native dependencies (no compiler needed) — installs cleanly on
//   shared hosting like Namecheap's cPanel "Setup Node.js App".
// - Easy to inspect/edit/back up by hand or via FTP.
// - Easy to bulk-import: see import-dentists.js (CSV -> dentists.json).
//
// If you outgrow this (thousands of dentists, lots of writes), the same
// function names here can be re-implemented on top of SQLite/Postgres
// without touching the route files.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

const FILES = {
  dentists: path.join(DATA_DIR, "dentists.json"),
  leads: path.join(DATA_DIR, "leads.json"),
  bookingRequests: path.join(DATA_DIR, "booking_requests.json"),
};

function ensureFile(file, defaultValue) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
}

function readJSON(file, defaultValue) {
  ensureFile(file, defaultValue);
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error(`Failed to parse ${file}:`, err);
    return defaultValue;
  }
}

function writeJSON(file, data) {
  ensureFile(file, []);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---- Dentists ----
function getAllDentists() {
  return readJSON(FILES.dentists, []);
}

function saveAllDentists(dentists) {
  writeJSON(FILES.dentists, dentists);
}

function getDentistById(id) {
  return getAllDentists().find((d) => String(d.id) === String(id));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function addDentist(dentist) {
  const dentists = getAllDentists();
  const record = { id: nextId(dentists), ...dentist };
  dentists.push(record);
  saveAllDentists(dentists);
  return record;
}

// ---- Leads (dentist sign-up requests) ----
function getAllLeads() {
  return readJSON(FILES.leads, []);
}

function addLead(lead) {
  const leads = getAllLeads();
  const record = { id: nextId(leads), createdAt: new Date().toISOString(), ...lead };
  leads.push(record);
  writeJSON(FILES.leads, leads);
  return record;
}

// ---- Booking requests (patient asks for SMS booking info) ----
function getAllBookingRequests() {
  return readJSON(FILES.bookingRequests, []);
}

function addBookingRequest(request) {
  const requests = getAllBookingRequests();
  const record = { id: nextId(requests), createdAt: new Date().toISOString(), ...request };
  requests.push(record);
  writeJSON(FILES.bookingRequests, requests);
  return record;
}

module.exports = {
  getAllDentists,
  saveAllDentists,
  getDentistById,
  addDentist,
  getAllLeads,
  addLead,
  getAllBookingRequests,
  addBookingRequest,
};
