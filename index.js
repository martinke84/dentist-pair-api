require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const dentistsRouter = require("./routes/dentists");
const leadsRouter = require("./routes/leads");
const bookingRouter = require("./routes/booking");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

// API routes
app.use("/api/dentists", dentistsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/booking-requests", bookingRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Optionally serve the static frontend from the same app/process.
// Set SERVE_FRONTEND=true and FRONTEND_DIR to the folder with index.html
// (useful on hosts that only let you run one Node app).
if (process.env.SERVE_FRONTEND === "true") {
  const frontendDir = path.resolve(
    __dirname,
    process.env.FRONTEND_DIR || "../"
  );
  app.use(express.static(frontendDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Dentist Pair API listening on port ${PORT}`);
});
