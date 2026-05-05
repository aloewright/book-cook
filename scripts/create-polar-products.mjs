const token = process.env.POLAR_ACCESS_TOKEN;
if (!token) {
  throw new Error(
    "POLAR_ACCESS_TOKEN is required. Run with `doppler run -- pnpm polar:create-products`.",
  );
}

const apiBase = process.env.POLAR_API_BASE_URL || "https://api.polar.sh";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const products = [
  {
    key: "pro",
    env: "POLAR_PRO_PRODUCT_ID",
    name: "Book Cook Pro",
    amount: 499,
    description: "Monthly access to Book Cook publishing and launch tools.",
  },
  {
    key: "grow",
    env: "POLAR_GROW_PRODUCT_ID",
    name: "Book Cook Grow",
    amount: 999,
    description: "Monthly access to Book Cook publishing and launch tools for growth workflows.",
  },
];

const existing = await request("/v1/products?limit=100");
const existingItems = Array.isArray(existing.items) ? existing.items : [];
const results = [];

for (const product of products) {
  const found = existingItems.find(
    (item) =>
      item?.name === product.name &&
      item?.recurring_interval === "month" &&
      item?.is_archived !== true,
  );
  if (found) {
    results.push({ ...product, id: found.id, created: false });
    continue;
  }

  const created = await request("/v1/products", {
    method: "POST",
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      recurring_interval: "month",
      recurring_interval_count: 1,
      visibility: "public",
      metadata: { app: "book-cook", plan: product.key },
      prices: [
        {
          amount_type: "fixed",
          price_currency: "usd",
          price_amount: product.amount,
        },
      ],
    }),
  });
  results.push({ ...product, id: created.id, created: true });
}

console.log(JSON.stringify({ apiBase, products: results }, null, 2));

async function request(path, init = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Polar request failed with ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}
