"use client"
// The Tracking tab of the admin dashboard: add-to-carts, initiated checkouts, product pages, homepage.
import { useEffect, useState } from "react"
import styles from "./Tracking.module.css"
import { addDays, api, cairoToday, count, money, plural } from "./trackingApi"
import ProductPagesSection from "./ProductPagesSection"
import HomepageSection from "./HomepageSection"

const PAGE_SIZE = 25

type Person = {
  kind: "customer" | "guest"
  customerId: number | null
  displayName: string
  phone: string | null
  email: string | null
  visitorCode: string
}
type Item = { productId: number; productName: string; variantLabel: string | null; quantity: number; unitPrice: number }
type AddToCartRow = {
  id: number; createdAtUtc: string; person: Person; item: Item; value: number
  source: string | null; campaign: string | null
}
type CheckoutRow = {
  id: number; createdAtUtc: string; person: Person; items: Item[]; itemCount: number; value: number
  orderId: number | null; source: string | null; campaign: string | null
}
type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number }
type Summary = {
  addToCarts: number; addToCartVisitors: number; initiatedCheckouts: number
  checkoutValue: number; purchasedCheckouts: number
}
type Section = "add-to-carts" | "checkouts" | "product-pages" | "homepage"
type Status = "all" | "purchased" | "not_purchased"

const SECTIONS: { key: Section; label: string }[] = [
  { key: "add-to-carts", label: "Add to Carts" },
  { key: "checkouts", label: "Initiated Checkouts" },
  { key: "product-pages", label: "Product Pages" },
  { key: "homepage", label: "Homepage" },
]

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Cairo", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })

// Egyptian mobile 01xxxxxxxxx -> wa.me/201xxxxxxxxx
const whatsAppLink = (phone: string | null) => {
  if (!phone) return null
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith("0")) digits = `2${digits}`
  return digits.length >= 11 ? `https://wa.me/${digits}` : null
}

function PersonCell({ person }: { person: Person }) {
  const wa = whatsAppLink(person.phone)
  return (
    <div className={styles.person}>
      <div className={styles.personName}>
        {person.displayName}
        <span className={person.kind === "customer" ? styles.badgeCustomer : styles.badgeGuest}>
          {person.kind === "customer" ? "Customer" : "Guest"}
        </span>
      </div>
      <div className={styles.muted}>
        {person.phone && (wa ? <a href={wa} target="_blank" rel="noreferrer">{person.phone}</a> : person.phone)}
        {person.phone && person.email && " · "}
        {person.email}
        {!person.phone && !person.email && "No contact details yet"}
      </div>
    </div>
  )
}

function SourceCell({ source, campaign }: { source: string | null; campaign: string | null }) {
  if (!source && !campaign) return <span className={styles.muted}>Direct / unknown</span>
  return (
    <div>
      <div>{source ?? "-"}</div>
      {campaign && <div className={styles.muted}>{campaign}</div>}
    </div>
  )
}

export default function TrackingTab() {
  const [section, setSection] = useState<Section>("add-to-carts")
  const [from, setFrom] = useState(() => addDays(cairoToday(), -29))
  const [to, setTo] = useState(() => cairoToday())
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<Status>("all")
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [addToCarts, setAddToCarts] = useState<Paged<AddToCartRow> | null>(null)
  const [checkouts, setCheckouts] = useState<Paged<CheckoutRow> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCommerce = section === "add-to-carts" || section === "checkouts"

  useEffect(() => {
    let cancelled = false
    api<Summary>("/api/admin/tracking/summary", { from, to })
      .then((s) => { if (!cancelled) setSummary(s) })
      .catch(() => { if (!cancelled) setSummary(null) })
    return () => { cancelled = true }
  }, [from, to])

  useEffect(() => {
    if (section !== "add-to-carts" && section !== "checkouts") return
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = { from, to, search, page: String(page), pageSize: String(PAGE_SIZE) }
    const request =
      section === "add-to-carts"
        ? api<Paged<AddToCartRow>>("/api/admin/tracking/add-to-carts", params).then((r) => {
            if (!cancelled) setAddToCarts(r)
          })
        : api<Paged<CheckoutRow>>("/api/admin/tracking/checkouts", { ...params, status }).then((r) => {
            if (!cancelled) setCheckouts(r)
          })
    request
      .catch(() => {
        if (!cancelled) setError("Tracking data could not be loaded. Try again.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [section, from, to, search, status, page])

  const current = section === "add-to-carts" ? addToCarts : section === "checkouts" ? checkouts : null
  const pages = current ? Math.max(1, Math.ceil(current.total / current.pageSize)) : 1
  const applySearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.switcher} role="tablist" aria-label="Tracking sections">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={section === s.key}
              className={section === s.key ? styles.switchActive : styles.switch}
              onClick={() => { setSection(s.key); setPage(1) }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <label className={styles.field}>
            From
            <input type="date" value={from} max={to} onChange={(e) => { if (e.target.value) { setFrom(e.target.value); setPage(1) } }} />
          </label>
          <label className={styles.field}>
            To
            <input type="date" value={to} min={from} onChange={(e) => { if (e.target.value) { setTo(e.target.value); setPage(1) } }} />
          </label>
          {section === "checkouts" && (
            <label className={styles.field}>
              Status
              <select value={status} onChange={(e) => { setStatus(e.target.value as Status); setPage(1) }}>
                <option value="all">All</option>
                <option value="not_purchased">Not purchased</option>
                <option value="purchased">Purchased</option>
              </select>
            </label>
          )}
          {isCommerce && (
            <>
              <input
                className={styles.search}
                aria-label="Search"
                placeholder="Search name, phone, email or product"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch() }}
              />
              <button className={styles.primary} onClick={applySearch}>Search</button>
            </>
          )}
        </div>
      </div>

      {isCommerce && (
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Add to Carts</div>
            <div className={styles.cardValue}>{summary ? count(summary.addToCarts) : "-"}</div>
            <div className={styles.muted}>{summary ? plural(summary.addToCartVisitors, "visitor", "visitors") : ""}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Initiated Checkouts</div>
            <div className={styles.cardValue}>{summary ? count(summary.initiatedCheckouts) : "-"}</div>
            <div className={styles.muted}>{summary ? `${count(summary.purchasedCheckouts)} became ${summary.purchasedCheckouts === 1 ? "an order" : "orders"}` : ""}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Checkout Value</div>
            <div className={styles.cardValue}>{summary ? money(summary.checkoutValue) : "-"}</div>
            <div className={styles.muted}>All initiated checkouts</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Not Purchased</div>
            <div className={styles.cardValue}>
              {summary ? count(summary.initiatedCheckouts - summary.purchasedCheckouts) : "-"}
            </div>
            <div className={styles.muted}>Checkouts to follow up</div>
          </div>
        </div>
      )}

      {isCommerce && (
        <>
          {error && <div className={styles.error} role="alert">{error}</div>}

          <div className={styles.tableWrap}>
            {section === "add-to-carts" ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Value</th><th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {addToCarts?.rows.map((r) => (
                    <tr key={`${r.id}-${r.item.productId}-${r.item.variantLabel ?? ""}`}>
                      <td className={styles.nowrap}>{when(r.createdAtUtc)}</td>
                      <td><PersonCell person={r.person} /></td>
                      <td>
                        <div>{r.item.productName}</div>
                        {r.item.variantLabel && <div className={styles.muted}>{r.item.variantLabel}</div>}
                      </td>
                      <td className={styles.num}>{r.item.quantity}</td>
                      <td className={`${styles.nowrap} ${styles.num}`}>{money(r.value)}</td>
                      <td><SourceCell source={r.source} campaign={r.campaign} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th><th>Customer</th><th>Products</th><th>Value</th><th>Status</th><th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {checkouts?.rows.map((r) => (
                    <tr key={r.id}>
                      <td className={styles.nowrap}>{when(r.createdAtUtc)}</td>
                      <td><PersonCell person={r.person} /></td>
                      <td>
                        {r.items.map((i) => (
                          <div key={`${i.productId}-${i.variantLabel ?? ""}`}>
                            {i.productName}
                            {i.variantLabel ? `, ${i.variantLabel}` : ""} <span className={styles.muted}>x{i.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className={`${styles.nowrap} ${styles.num}`}>{money(r.value)}</td>
                      <td>
                        {r.orderId != null ? (
                          <span className={styles.badgePurchased}>Purchased #{r.orderId}</span>
                        ) : (
                          <span className={styles.badgeOpen}>Not purchased</span>
                        )}
                      </td>
                      <td><SourceCell source={r.source} campaign={r.campaign} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && current && current.rows.length === 0 && (
              <div className={styles.empty}>Nothing tracked for these dates yet.</div>
            )}
            {loading && <div className={styles.empty}>Loading...</div>}
          </div>

          <div className={styles.pager}>
            <span className={styles.muted}>
              {current ? `${plural(current.total, "record", "records")} · page ${page} of ${pages}` : ""}
            </span>
            <div>
              <button className={styles.ghost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className={styles.ghost} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
      {section === "product-pages" && <ProductPagesSection from={from} to={to} />}
      {section === "homepage" && <HomepageSection from={from} to={to} />}
    </div>
  )
}
