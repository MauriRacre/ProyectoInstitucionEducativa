function generatePing(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ping = "";

  for (let i = 0; i < length; i++) {
    ping += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return ping;
}

module.exports = { generatePing };
