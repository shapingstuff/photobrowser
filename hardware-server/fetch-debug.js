const fetch = require("node-fetch");

(async () => {
  try {
    const res = await fetch("http://192.168.68.81:2342/api/v1/albums");
    const data = await res.json();
    console.log("✅ Raw data:");
    console.dir(data, { depth: null });
  } catch (err) {
    console.error("❌ Fetch failed:", err);
  }
})();
