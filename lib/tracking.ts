// lib/tracking.ts: storefront tracking for the admin Tracking tab (browser only).
// Every call is fire-and-forget: tracking never slows down or breaks the shop.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const VISITOR_COOKIE = "kb_vid"
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export type TrackItem = { productId: number; variantId?: number | null; quantity: number }
type Utm = { source?: string; medium?: string; campaign?: string; fbclid?: string }

const inBrowser = () => typeof window !== "undefined"

function session(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null // storage blocked: track without it
  }
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

/** The anonymous ID of this browser. Created on the first visit, kept for a year. */
export function getVisitorId(): string {
  const existing = readCookie(VISITOR_COOKIE)
  const id = existing && GUID.test(existing) ? existing : uuid()
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${VISITOR_COOKIE}=${id}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`
  return id
}

/** One browser tab's visit. */
export function getSessionId(): string {
  const store = session()
  let id = store?.getItem("kb_sid") ?? null
  if (!id) {
    id = uuid()
    store?.setItem("kb_sid", id)
  }
  return id
}

/** Keeps the UTM tags of the landing page for the rest of the visit. */
export function captureUtm(): void {
  const p = new URLSearchParams(location.search)
  const utm: Utm = {
    source: p.get("utm_source") ?? undefined,
    medium: p.get("utm_medium") ?? undefined,
    campaign: p.get("utm_campaign") ?? undefined,
    fbclid: p.get("fbclid") ?? undefined,
  }
  if (utm.source || utm.medium || utm.campaign || utm.fbclid) {
    session()?.setItem("kb_utm", JSON.stringify(utm))
  }
}

export function getUtm(): Utm | null {
  try {
    return JSON.parse(session()?.getItem("kb_utm") ?? "null") as Utm | null
  } catch {
    return null
  }
}

/** The same login token the rest of the site sends, so the API knows a logged-in customer. */
function customerAuthHeader(): Record<string, string> {
  const token = session()?.getItem("authToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function url(path: string): string {
  return `${API_BASE}${path}?vid=${encodeURIComponent(getVisitorId())}`
}

/** A JSON POST with the customer's login, still delivered if the shopper navigates away. */
export async function send(path: string, body: unknown): Promise<void> {
  try {
    await fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...customerAuthHeader() },
      body: JSON.stringify(body),
      keepalive: true,
    })
  } catch {
    // Tracking must never break the shop.
  }
}

/**
 * For data sent while the page closes (time on page, a click that leaves the page): a beacon is the
 * one request every browser still delivers then. It carries no login, so only anonymous data goes this way.
 */
export function beacon(path: string, body: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "text/plain" })
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url(path), blob)) return
    void fetch(url(path), { method: "POST", body: blob, keepalive: true }).catch(() => undefined)
  } catch {
    // Tracking must never break the shop.
  }
}

/** Call right after a product is added to the cart. Returns the event ID (reuse it as the Meta pixel's eventID). */
export function trackAddToCart(item: TrackItem): string | null {
  if (!inBrowser()) return null
  const eventId = uuid()
  void send("/api/tracking/events", {
    eventId,
    eventType: "add_to_cart",
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    items: [{ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity }],
    pageUrl: location.href,
    utm: getUtm(),
  })
  return eventId
}

/**
 * Call when the checkout page opens. Fires once per distinct cart, so a page refresh is not
 * counted twice. Returns the checkout token to send with the order.
 */
export function trackInitiateCheckout(items: TrackItem[]): string | null {
  if (!inBrowser() || items.length === 0) return null
  const store = session()
  const signature = items
    .map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`)
    .sort()
    .join("|")
  const existing = store?.getItem("kb_ic_token")
  if (existing && store?.getItem("kb_ic_sig") === signature) return existing

  const token = uuid()
  store?.setItem("kb_ic_sig", signature)
  store?.setItem("kb_ic_token", token)
  void send("/api/tracking/events", {
    eventId: uuid(),
    eventType: "initiate_checkout",
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    checkoutToken: token,
    items: items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, quantity: i.quantity })),
    pageUrl: location.href,
    utm: getUtm(),
  })
  return token
}

/** The token of the current checkout, to include in the place-order request. */
export function getCheckoutToken(): string | null {
  return inBrowser() ? session()?.getItem("kb_ic_token") ?? null : null
}

/** Call after the order is placed, so the next checkout starts fresh. */
export function clearCheckoutToken(): void {
  if (!inBrowser()) return
  session()?.removeItem("kb_ic_sig")
  session()?.removeItem("kb_ic_token")
}

let lastContact = ""

/** Call after login or registration (no arguments), and when a guest types contact details at checkout. */
export function identify(contact: { name?: string; phone?: string; email?: string } = {}): void {
  if (!inBrowser()) return
  const cleaned = {
    name: contact.name?.trim() || undefined,
    phone: contact.phone?.trim() || undefined,
    email: contact.email?.trim() || undefined,
  }
  const key = JSON.stringify(cleaned)
  if (key !== "{}" && key === lastContact) return // nothing new since the last field
  lastContact = key
  void send("/api/tracking/identify", { visitorId: getVisitorId(), ...cleaned })
}
