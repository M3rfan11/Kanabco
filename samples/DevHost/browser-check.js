// Drives the real storefront and admin pages against the stand-in API, then checks what the Tracking tab reads.
const { chromium } = require('playwright');
const WEB = 'http://localhost:3000', API = 'http://localhost:8080';
const out = process.argv[2];
const log = (...a) => console.log(...a);
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
const q = `?from=${today}&to=${today}`;
async function admin(path, token = 'staff-tracking') {
  const r = await fetch(API + path + (path.includes('?') ? '&' : '?') + `from=${today}&to=${today}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.status === 200 ? r.json() : r.status;
}
const settle = (ms = 800) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();

  // 1. A shopper from a Facebook ad: homepage, a click, a product, add to cart, checkout, order.
  const a = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await a.newPage();
  p.on('dialog', (d) => d.accept());
  const pending = new Map();
  p.on('request', (r) => pending.set(r, r.url()));
  p.on('requestfinished', (r) => pending.delete(r));
  p.on('requestfailed', (r) => { if (!r.url().includes('/_next/')) log('request failed:', r.url().replace(WEB, '').slice(0, 90), r.failure()?.errorText); pending.delete(r); });
  await p.goto(`${WEB}/?utm_source=facebook&utm_campaign=winter`, { waitUntil: 'load' });
  await settle();
  await p.locator('[data-track="hero-next"]').first().click();
  await settle(300);
  await p.goto(`${WEB}/product/1`, { waitUntil: 'load' });
  await p.getByRole('button', { name: /add to cart/i }).first().click();
  await settle();
  await p.goto(`${WEB}/checkout`, { waitUntil: 'load' });
  await settle();
  log('still open on checkout:', [...pending.values()].map((u) => u.slice(0, 90)).join(' | ') || 'none');
  await p.getByPlaceholder('Email address').fill('hany@example.com');
  await p.getByPlaceholder('Phone number').fill('01112223334');
  await p.getByPlaceholder('First name').fill('Hany');
  await p.getByPlaceholder('Last name').fill('Samir');
  await p.getByPlaceholder('Address', { exact: true }).fill('12 Road 9');
  await p.getByPlaceholder('City').fill('Maadi');
  await p.locator('select').first().selectOption({ index: 1 });
  await settle();
  const between = await admin('/api/admin/tracking/checkouts');
  log('checkout before ordering:', JSON.stringify(between.rows?.map((r) => [r.person.displayName, r.person.phone, r.orderId])));
  await p.getByRole('button', { name: /place order|complete order|pay now/i }).first().click();
  await p.waitForURL(/order-confirmation/, { timeout: 15000 });
  log('order placed:', p.url().replace(WEB, ''));

  // 2. A shopper who lands on a product from Instagram and closes the tab: a bounce.
  const b = await browser.newContext();
  const pb = await b.newPage();
  await pb.goto(`${WEB}/product/2?utm_source=instagram`, { waitUntil: 'load', referer: 'https://www.instagram.com/' });
  await settle(2500);
  await pb.close({ runBeforeUnload: true });
  await settle();

  // 3. A shopper who opens checkout, types a name and phone, then leaves: the follow-up list.
  const c = await browser.newContext();
  await c.addInitScript(() => localStorage.setItem('cart', JSON.stringify([
    { productId: 3, variantId: 30, name: 'Maadi Table', color: 'Walnut', size: null, price: 9000, quantity: 2, image: '/placeholder.svg', sku: null },
  ])));
  const pc = await c.newPage();
  await pc.goto(`${WEB}/checkout`, { waitUntil: 'load' });
  await settle(2000);
  await pc.getByPlaceholder('First name').fill('Nour');
  await pc.getByPlaceholder('Last name').fill('Fathy');
  await pc.getByPlaceholder('Phone number').fill('01223334445');
  await pc.getByPlaceholder('Email address').click();
  await settle();
  await pc.close({ runBeforeUnload: true });
  await settle(1200);

  // What the Tracking tab now reads.
  const summary = await admin('/api/admin/tracking/summary');
  const carts = await admin('/api/admin/tracking/add-to-carts');
  const checkouts = await admin('/api/admin/tracking/checkouts');
  const products = await admin('/api/admin/tracking/product-pages');
  const home = await admin('/api/admin/tracking/homepage');
  log('summary:', JSON.stringify(summary));
  log('add to carts:', JSON.stringify(carts.rows.map((r) => [r.person.displayName, r.item.productName, r.item.variantLabel, r.value, r.source, r.campaign])));
  log('checkouts:', JSON.stringify(checkouts.rows.map((r) => [r.person.displayName, r.person.phone, r.value, r.orderId])));
  log('product pages:', JSON.stringify(products.rows.map((r) => [r.productName, r.views, r.landings, r.bounces, r.addedToCart])));
  log('homepage:', JSON.stringify({ views: home.views, withClick: home.viewsWithClick, elements: home.elements.map((e) => [e.element, e.clicks]), buckets: home.timeBuckets }));
  log('no permission:', await admin('/api/admin/tracking/summary', 'staff-plain'));

  // 4. The admin with the Tracking permission, and one without.
  for (const [token, name] of [['staff-tracking', 'with'], ['staff-plain', 'without']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    await ctx.addInitScript((t) => sessionStorage.setItem('authToken', t), token);
    const pa = await ctx.newPage();
    await pa.goto(`${WEB}/admin`, { waitUntil: 'load' });
    await settle(1500);
    const tab = pa.getByRole('button', { name: 'Tracking', exact: true });
    log(`admin ${name} permission: Tracking button visible =`, await tab.isVisible());
    if (name === 'with') {
      await tab.click();
      await settle(1500);
      const wrap = pa.locator('[aria-label="Tracking sections"]').locator('xpath=../..');
      for (const section of ['Add to Carts', 'Initiated Checkouts', 'Product Pages', 'Homepage']) {
        await pa.getByRole('tab', { name: section }).click();
        await settle(1200);
        await wrap.screenshot({ path: `${out}/${section.toLowerCase().replace(/ /g, '-')}.png` });
      }
      await pa.setViewportSize({ width: 390, height: 844 });
      await pa.getByRole('tab', { name: 'Initiated Checkouts' }).click();
      await settle(1000);
      const overflow = await pa.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      log('phone width, page wider than screen:', overflow);
    }
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
