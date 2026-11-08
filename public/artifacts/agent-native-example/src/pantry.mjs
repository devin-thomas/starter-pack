// The app's own logic. In your project this is the code you already have:
// the capability layer in capabilities.mjs calls it instead of copying it.

const LOW_STOCK_BELOW = 2;

const SAMPLE_ITEMS = [
  { name: "rice", quantity: 1, unit: "bag" },
  { name: "oats", quantity: 4, unit: "jar" },
  { name: "lentils", quantity: 0, unit: "bag" },
  { name: "tea", quantity: 6, unit: "box" },
];

function withLowFlag(item) {
  return { ...item, low: item.quantity < LOW_STOCK_BELOW };
}

/** Create an in-memory pantry. Each process gets its own synthetic copy. */
export function createPantry(items = SAMPLE_ITEMS) {
  const stock = new Map(items.map((item) => [item.name, { ...item }]));
  return {
    list({ low = false } = {}) {
      const all = [...stock.values()].map(withLowFlag);
      return low ? all.filter((item) => item.low) : all;
    },
    restock(name, quantity) {
      const item = stock.get(name);
      if (item === undefined) throw new Error("unknown pantry item");
      item.quantity += quantity;
      return withLowFlag(item);
    },
  };
}
