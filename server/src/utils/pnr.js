/**
 * Generates a booking reference (PNR) like "PNR-A1B2C3".
 * Not cryptographically secure, but collision risk is negligible
 * at scale (36^6 = ~2.1 billion combinations) and we have a
 * unique DB index on bookingReference as a final safety net.
 */
const generatePNR = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PNR-${ref}`;
};

module.exports = { generatePNR };
