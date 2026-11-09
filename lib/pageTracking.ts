// lib/pageTracking.ts: page views, active time on page, and homepage clicks (browser only).
import { beacon, getSessionId, getUtm, getVisitorId, send, uuid } from "./tracking"

export type PageType = "home" | "product" | "category" | "cart" | "checkout" | "other"

/** The storefront's routes; admin pages are not tracked at all. */
export function pageFromPath(pathname: string): { pageType: PageType; productId: number | null } | null {
  if (pathname.startsWith("/admin")) return null
  if (pathname === "/") return { pageType: "home", productId: null }
  const product = pathname.match(/^\/product\/(\d+)/)
  if (product) return { pageType: "product", productId: Number(product[1]) }
  if (pathname.startsWith("/collections")) return { pageType: "category", productId: null }
  if (pathname.startsWith("/cart")) return { pageType: "cart", productId: null }
  if (pathname.startsWith("/checkout")) return { pageType: "checkout", productId: null }
  return { pageType: "other", productId: null }
}

type CurrentPage = {
  id: string
  pageType: PageType
  path: string
  startedAt: number
  visibleSince: number | null // null while the tab is hidden
  activeMs: number
}
let current: CurrentPage | null = null
let listening = false

function activeSeconds(page: CurrentPage): number {
  const live = page.visibleSince != null ? Date.now() - page.visibleSince : 0
  return Math.round((page.activeMs + live) / 1000)
}

function flushEngagement(): void {
  if (!current) return
  beacon("/api/tracking/engagement", { pageViewId: current.id, activeSeconds: activeSeconds(current) })
}

function onVisibilityChange(): void {
  if (!current) return
  if (document.visibilityState === "hidden") {
    if (current.visibleSince != null) {
      current.activeMs += Date.now() - current.visibleSince
      current.visibleSince = null
    }
    flushEngagement() // the visitor may never come back to this tab, so report now
  } else if (current.visibleSince == null) {
    current.visibleSince = Date.now()
  }
}

function referrerHost(): string {
  try {
    return document.referrer ? new URL(document.referrer).host : ""
  } catch {
    return ""
  }
}

function pagesSeen(): number {
  try {
    return Number(sessionStorage.getItem("kb_pv_count") ?? "0")
  } catch {
    return 0
  }
}

function countPage(seen: number): void {
  try {
    sessionStorage.setItem("kb_pv_count", String(seen + 1))
  } catch {
    // storage blocked
  }
}

/** Records a page view. TrackingInit calls it on every page change. */
export function trackPageView(pathname: string): void {
  if (typeof window === "undefined") return
  const page = pageFromPath(pathname)
  if (!page) return
  if (current && current.path === pathname && Date.now() - current.startedAt < 1000) return // React dev double-run

  flushEngagement() // closes the previous page after a client-side navigation
  if (!listening) {
    listening = true
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", flushEngagement)
  }

  const seen = pagesSeen()
  const refHost = referrerHost()
  const isEntry = seen === 0 && refHost !== location.host // first page of the visit, from outside the site
  countPage(seen)

  const now = Date.now()
  current = {
    id: uuid(),
    pageType: page.pageType,
    path: pathname,
    startedAt: now,
    visibleSince: document.visibilityState === "visible" ? now : null,
    activeMs: 0,
  }
  void send("/api/tracking/pageview", {
    pageViewId: current.id,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    pageType: page.pageType,
    productId: page.productId,
    path: pathname,
    isEntry,
    referrerHost: refHost || null,
    utm: getUtm(),
  })
}

function onClick(event: MouseEvent): void {
  if (!current) return
  const target = event.target instanceof Element ? event.target : null
  const tagged = target?.closest<HTMLElement>("[data-track]") ?? null
  const link = target?.closest<HTMLAnchorElement>("a[href]") ?? null
  if (!tagged && !link) return

  const product = target?.closest<HTMLElement>("[data-track-product]")?.dataset.trackProduct
  let targetPath: string | null = null
  if (link) {
    try {
      const to = new URL(link.href)
      targetPath = to.host === location.host ? to.pathname : to.host
    } catch {
      targetPath = null
    }
  }
  beacon("/api/tracking/click", {
    clickId: uuid(),
    pageViewId: current.id,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    pageType: current.pageType,
    element: tagged?.dataset.track ?? "untagged-link",
    productId: product && /^\d+$/.test(product) ? Number(product) : null,
    targetPath,
  })
}

/** Records clicks on the current page. TrackingInit turns it on for the homepage only. */
export function startClickTracking(): () => void {
  document.addEventListener("click", onClick, { capture: true })
  return () => document.removeEventListener("click", onClick, { capture: true })
}
