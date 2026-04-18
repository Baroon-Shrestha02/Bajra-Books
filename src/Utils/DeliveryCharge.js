const ZONES = {
  kathmandu: ["kathmandu", "lalitpur", "bhaktapur"],
  outside_valley: [
    "pokhara",
    "chitwan",
    "butwal",
    "hetauda",
    "birgunj",
    "biratnagar",
    "dharan",
    "itahari",
    "janakpur",
    "nepalgunj",
    "dhangadhi",
    "tulsipur",
    "ghorahi",
  ],
  remote: [], // everything else falls here
};

const DELIVERY_RATES = {
  kathmandu: [
    { min: 0, max: 1000, price: 80 },
    { min: 1000, max: 1500, price: 120 },
    { min: 1500, max: 2000, price: 160 },
    { min: 2000, max: 2500, price: 240 },
    { min: 2500, max: 3000, price: 280 },
    { min: 3000, max: 3500, price: 320 },
    { min: 3500, max: 4000, price: 360 },
    { min: 4000, max: 5000, price: 420 },
    { min: 5000, max: 6000, price: 460 },
    { min: 6000, max: 7000, price: 480 },
    { min: 7000, max: 8000, price: 540 },
    { min: 8000, max: 9000, price: 600 },
    { min: 9000, max: 10000, price: 660 },
    { min: 10000, max: 11000, price: 720 },
    { min: 11000, max: 12000, price: 780 },
    { min: 12000, max: 13000, price: 840 },
    { min: 13000, max: Infinity, price: 900 },
  ],
  outside_valley: [
    { min: 0, max: 1000, price: 150 },
    { min: 1000, max: 2000, price: 200 },
    { min: 2000, max: 3000, price: 280 },
    { min: 3000, max: 4000, price: 360 },
    { min: 4000, max: 5000, price: 440 },
    { min: 5000, max: 6000, price: 520 },
    { min: 6000, max: 7000, price: 600 },
    { min: 7000, max: 8000, price: 680 },
    { min: 8000, max: 9000, price: 760 },
    { min: 9000, max: 10000, price: 840 },
    { min: 10000, max: Infinity, price: 920 },
  ],
  remote: [
    { min: 0, max: 1000, price: 250 },
    { min: 1000, max: 2000, price: 350 },
    { min: 2000, max: 3000, price: 450 },
    { min: 3000, max: 4000, price: 550 },
    { min: 4000, max: 5000, price: 650 },
    { min: 5000, max: Infinity, price: 750 },
  ],
};

// ─── Get Zone from District ───────────────────────────────────────────────────

export const getZone = (district) => {
  const normalized = district.toLowerCase().trim();

  if (ZONES.kathmandu.includes(normalized)) return "kathmandu";
  if (ZONES.outside_valley.includes(normalized)) return "outside_valley";
  return "remote"; // default fallback
};

// ─── Calculate Delivery Charge ────────────────────────────────────────────────

export const calculateDeliveryCharge = (district, weightInGrams) => {
  const zone = getZone(district);
  const rates = DELIVERY_RATES[zone];

  const rate = rates.find(
    (r) => weightInGrams >= r.min && weightInGrams < r.max,
  );

  return {
    zone,
    weightInGrams,
    deliveryCharge: rate ? rate.price : 0,
  };
};
