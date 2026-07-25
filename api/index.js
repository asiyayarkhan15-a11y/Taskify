// Vercel serverless entrypoint — reuses the Express app from server.js.
// Kept in /api so Vercel's function config (maxDuration, region) applies.
module.exports = require("../server.js");
