// Bulk-import dentists from a CSV file into data/dentists.json.
//
// Usage:
//   node import-dentists.js path/to/dentists.csv
//   node import-dentists.js path/to/dentists.csv --replace   (overwrite existing list)
//
// Expected CSV columns (header row required), see dentists-template.csv:
//   name, address, zip, phone, specialties, hours, bookingUrl, acceptingNewPatients
//
// - "specialties" can be multiple values separated by " | " (e.g. "General | Pediatric")
// - "acceptingNewPatients" should be "true" or "false" (defaults to true if blank)
// - city/state/lat/lng are looked up automatically from the zip code

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const db = require("./db");
const { lookupZip } = require("./geo");

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const replace = args.includes("--replace");

if (!csvPath) {
  console.error("Usage: node import-dentists.js path/to/dentists.csv [--replace]");
  process.exit(1);
}

const fullPath = path.resolve(csvPath);
if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(fullPath, "utf-8");
const records = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

let imported = 0;
let skipped = 0;
const newDentists = [];

for (const row of records) {
  const name = row.name || row.Name;
  const address = row.address || row.Address;
  const zip = (row.zip || row.Zip || row.ZIP || "").toString().trim();

  if (!name || !address || !zip) {
    console.warn(`Skipping row (missing name/address/zip): ${JSON.stringify(row)}`);
    skipped++;
    continue;
  }

  const location = lookupZip(zip);
  if (!location) {
    console.warn(`Skipping "${name}" — unrecognized zip code: ${zip}`);
    skipped++;
    continue;
  }

  const specialties = (row.specialties || row.Specialties || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const acceptingRaw = (row.acceptingNewPatients || "").toString().trim().toLowerCase();
  const acceptingNewPatients = acceptingRaw === "" ? true : acceptingRaw !== "false";

  newDentists.push({
    name,
    address,
    zip,
    city: location.city,
    state: location.state,
    lat: location.latitude,
    lng: location.longitude,
    phone: row.phone || row.Phone || "",
    specialties,
    hours: row.hours || row.Hours || "",
    bookingUrl: row.bookingUrl || "",
    acceptingNewPatients,
  });
  imported++;
}

let existing = replace ? [] : db.getAllDentists();
let nextId = existing.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0) + 1;

for (const dentist of newDentists) {
  existing.push({ id: nextId++, ...dentist });
}

db.saveAllDentists(existing);

console.log(`Imported ${imported} dentist(s), skipped ${skipped}.`);
console.log(`Total dentists in database: ${existing.length}`);
