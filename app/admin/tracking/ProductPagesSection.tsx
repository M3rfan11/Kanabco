"use client"
// Product Pages: bounce rate, time on page and add-to-cart rate, per product.
import { useEffect, useState } from "react"
import styles from "./Tracking.module.css"
import { api, count, duration, percent, plural } from "./trackingApi"

type Row = {
  productId: number; productName: string; views: number; visits: number; landings: number; bounces: number
  bounceRate: number | null; avgActiveSeconds: number | null; addedToCart: number; addToCartRate: number | null
}
type Totals = { views: number; landings: number; bounces: number; bounceRate: number | null; avgActiveSeconds: number | null }
type Result = { rows: Row[]; total: number; page: number; pageSize: number; totals: Totals }
type Sort = "views" | "bounce" | "add_to_cart"

function Meter({ rate, tone }: { rate: number | null; tone: "orange" | "green" }) {
  return (
    <div className={styles.meter}>
      <div
        className={tone === "orange" ? styles.meterFill : styles.meterFillGreen}
        style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
      />
    </div>
  )
}

export default function ProductPagesSection({ from, to }: { from: string; to: string }) {
  const [sort, setSort] = useState<Sort>("views")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    api<Result>("/api/admin/tracking/product-pages", { from, to, sort, search, page: String(page), pageSize: "25" })
      .then((r) => { if (!cancelled) setData(r) })
      .catch(() => { if (!cancelled) setError("Product page data could not be loaded. Try again.") })
    return () => { cancelled = true }
  }, [from, to, sort, search, page])

  const t = data?.totals
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const applySearch = () => { setPage(1); setSearch(searchInput.trim()) }

  return (
    <>
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Product Page Views</div>
          <div className={styles.cardValue}>{t ? count(t.views) : "-"}</div>
          <div className={styles.muted}>{t ? `${plural(t.landings, "landing", "landings")} from outside the site` : ""}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Bounce Rate</div>
          <div className={styles.cardValue}>{percent(t?.bounceRate)}</div>
          <div className={styles.muted}>{t ? `${count(t.bounces)} of ${count(t.landings)} landings left` : ""}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Avg. Time on Product</div>
          <div className={styles.cardValue}>{duration(t?.avgActiveSeconds)}</div>
          <div className={styles.muted}>Active time, tab visible</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Products Viewed</div>
          <div className={styles.cardValue}>{data ? count(data.total) : "-"}</div>
          <div className={styles.muted}>With at least one view</div>
        </div>
      </div>

      <div className={styles.subbar}>
        <label className={styles.field}>
          Sort by
          <select value={sort} onChange={(e) => { setSort(e.target.value as Sort); setPage(1) }}>
            <option value="views">Most viewed</option>
            <option value="bounce">Highest bounce rate</option>
            <option value="add_to_cart">Lowest add-to-cart rate</option>
          </select>
        </label>
        <input
          className={styles.search}
          aria-label="Search product"
          placeholder="Search product"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applySearch() }}
        />
        <button className={styles.primary} onClick={applySearch}>Search</button>
      </div>
      {sort === "bounce" && (
        <div className={styles.muted}>Products with fewer than 5 landings come after the rest, so one visit does not top the list.</div>
      )}

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th><th>Views</th><th>Landings</th><th>Bounce rate</th><th>Avg. time</th><th>Added to cart</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.productId}>
                <td>
                  <div className={styles.personName}>{r.productName}</div>
                  <div className={styles.muted}>{plural(r.visits, "visit", "visits")}</div>
                </td>
                <td className={styles.num}>{count(r.views)}</td>
                <td className={styles.num}>{count(r.landings)}</td>
                <td className={styles.meterCell}>
                  <div className={styles.meterLine}>
                    <b>{percent(r.bounceRate)}</b><span className={styles.muted}>{r.bounces} of {r.landings}</span>
                  </div>
                  <Meter rate={r.bounceRate} tone="orange" />
                </td>
                <td className={`${styles.nowrap} ${styles.num}`}>{duration(r.avgActiveSeconds)}</td>
                <td className={styles.meterCell}>
                  <div className={styles.meterLine}>
                    <b>{percent(r.addToCartRate)}</b><span className={styles.muted}>{r.addedToCart} of {r.visits} visits</span>
                  </div>
                  <Meter rate={r.addToCartRate} tone="green" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.rows.length === 0 && <div className={styles.empty}>No product page views for these dates yet.</div>}
      </div>

      <div className={styles.pager}>
        <span className={styles.muted}>{data ? `${plural(data.total, "product", "products")} · page ${page} of ${pages}` : ""}</span>
        <div>
          <button className={styles.ghost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button className={styles.ghost} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </>
  )
}
