// Zip code -> lat/lng lookup and distance helpers.
// Uses the "zipcodes" npm package, which bundles a full US zip code
// dataset (no external API or key required).

const zipcodes = require("zipcodes");

function lookupZip(zip) {
  return zipcodes.lookup(zip);
}

// Haversine distance in miles between two lat/lng points
function distanceMiles(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { lookupZip, distanceMiles };
