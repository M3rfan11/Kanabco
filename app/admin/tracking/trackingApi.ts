// Shared helpers for the admin Tracking tab.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/** GET from the admin tracking API with the admin's login, as the rest of the dashboard does. */
export async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null
  const res = await fetch(`${API_BASE}${path}?${new URLSearchParams(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return (await res.json()) as T
}

export const count = (n: number) => n.toLocaleString("en-US")
/** "1 visitor", "3 visitors". */
export const plural = (n: number, one: string, many: string) => `${count(n)} ${n === 1 ? one : many}`
export const money = (n: number) => `LE ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
export const percent = (rate: number | null | undefined) => (rate == null ? "-" : `${Math.round(rate * 100)}%`)
export const duration = (seconds: number | null | undefined) => {
  if (seconds == null) return "-"
  const s = Math.round(seconds)
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`
}

/** Today in Cairo as yyyy-mm-dd, whatever the admin's computer is set to; the API reads days as Cairo days. */
export function cairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

/** A yyyy-mm-dd date moved by whole days. */
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
