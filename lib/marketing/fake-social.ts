/**
 * ⚠ MOCK DATA — INVENTED PAKISTANI NAMES + CITIES FOR THE ORDER TICKER ⚠
 *
 * This file generates fake order events for the marketing ticker.
 * Per feedback_unverified_claims, invented social-proof carries
 * legal risk under PK consumer-protection / PEMRA rules. Wire this
 * to the real `orders` table before public launch:
 *   - filter to orders within the last 7 days
 *   - anonymize to first name + city only
 *   - skip orders flagged opt-out
 *
 * Swap by replacing the body of `recentOrders()` with a DB query.
 * The exported shape stays identical.
 */

export interface OrderTickerEvent {
  /** Display string, e.g. 'Ayesha K.' */
  name: string;
  /** Pakistani city. */
  city: string;
  /** Product or protocol name. */
  product: string;
  /** Minutes since the event (used to render "12 minutes ago"). */
  minutesAgo: number;
}

const FIRST_NAMES_FEMALE = [
  'Ayesha', 'Hina', 'Sara', 'Maham', 'Zainab', 'Fatima', 'Aisha', 'Mariam',
  'Hira', 'Nida', 'Rabia', 'Sana', 'Maira', 'Iqra', 'Anum', 'Saba',
  'Farah', 'Maryam', 'Aiman', 'Khadija', 'Aliya', 'Mehwish', 'Areeba',
  'Eman', 'Rida', 'Maliha', 'Sehrish', 'Iman', 'Anam', 'Saima', 'Rimsha',
  'Bushra', 'Salma', 'Hibba', 'Faria', 'Tehmina', 'Komal', 'Mahnoor',
];

const FIRST_NAMES_MALE = [
  'Bilal', 'Ahmed', 'Hassan', 'Hamza', 'Ali', 'Usman', 'Faisal', 'Salman',
  'Adnan', 'Imran', 'Asad', 'Rehan', 'Zain', 'Saad', 'Umer', 'Nabeel',
  'Talha', 'Rizwan', 'Awais', 'Junaid', 'Kashif', 'Tariq', 'Shahzaib',
  'Hammad', 'Fahad', 'Owais', 'Raheel',
];

const LAST_INITIALS = ['K.', 'A.', 'M.', 'R.', 'S.', 'H.', 'B.', 'T.', 'F.', 'N.', 'Q.', 'I.'];

const PK_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Quetta', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Sheikhupura', 'Mardan', 'Mingora', 'Abbottabad',
  'Murree', 'Larkana',
];

// Weighted toward the big-three cities since most real PK e-commerce
// orders come from them. Visual feel mirrors what the DB will show.
const CITY_WEIGHTS: Record<string, number> = {
  Karachi: 5, Lahore: 5, Islamabad: 3, Rawalpindi: 2, Faisalabad: 2,
  Multan: 2, Peshawar: 1, Sialkot: 1, Gujranwala: 1, Hyderabad: 1,
};

const PRODUCTS = [
  'the Clear Skin Protocol',
  'the Even Tone Protocol',
  'the Renewal Protocol',
  'the Barrier Protocol',
  'the Vitamin CE Ferrulic Serum',
  'the Clarifying Acne Serum',
  'the Hyaluronic Acid Serum',
  'the Barrier Restore SPF 50+',
  'the Retinol Serum',
  'the Radiance Lightening Cream',
];

function weightedCity(rng: () => number): string {
  // Build the weighted pool once per call (small N, fine).
  const pool: string[] = [];
  for (const c of PK_CITIES) {
    const w = CITY_WEIGHTS[c] ?? 1;
    for (let i = 0; i < w; i += 1) pool.push(c);
  }
  return pool[Math.floor(rng() * pool.length)];
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Seeded RNG so the same seed produces the same sequence — keeps the
// ticker stable across SSR/hydration boundaries when needed.
function seedRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function generateOrderEvent(seed: number): OrderTickerEvent {
  const rng = seedRng(seed);
  const female = rng() < 0.78; // skew female since most skincare buyers are
  const first = female ? pick(FIRST_NAMES_FEMALE, rng) : pick(FIRST_NAMES_MALE, rng);
  const init = pick(LAST_INITIALS, rng);
  return {
    name: `${first} ${init}`,
    city: weightedCity(rng),
    product: pick(PRODUCTS, rng),
    // 1–47 minutes ago — anything older feels stale.
    minutesAgo: 1 + Math.floor(rng() * 46),
  };
}

/**
 * Generate a stream of N events with monotonically-increasing seeds.
 * Used by the ticker component to rotate through events.
 */
export function generateOrderStream(count: number, baseSeed = Date.now()): OrderTickerEvent[] {
  return Array.from({ length: count }, (_, i) => generateOrderEvent(baseSeed + i * 7919));
}

/**
 * MOCK: total customers number used elsewhere ("more than 1,000 people").
 * Replace with a real DB COUNT(*) when wiring up.
 */
export const MOCK_CUSTOMER_COUNT = 1247;
