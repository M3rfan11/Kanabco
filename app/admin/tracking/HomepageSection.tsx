"use client"
// Homepage: how long people stay, and what they click.
import { useEffect, useState } from "react"
import styles from "./Tracking.module.css"
import { api, count, duration, percent, plural } from "./trackingApi"

const NOT_MEASURED = "Not measured"

type Bucket = { label: string; views: number }
type ElementRow = { element: string; clicks: number; viewsWithClick: number; clickThroughRate: number | null }
type ProductClick = { productId: number; productName: string; clicks: number }
type Result = {
  views: number; visitors: number; avgActiveSeconds: number | null; viewsWithClick: number
  timeBuckets: Bucket[]; elements: ElementRow[]; products: ProductClick[]
}

export default function HomepageSection({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    api<Result>("/api/admin/tracking/homepage", { from, to })
      .then((r) => { if (!cancelled) setData(r) })
      .catch(() => { if (!cancelled) setError("Homepage data could not be loaded. Try again.") })
    return () => { cancelled = true }
  }, [from, to])

  const views = data?.views ?? 0
  const maxBucket = Math.max(1, ...(data?.timeBuckets.map((b) => b.views) ?? [0]))
  const maxProduct = Math.max(1, ...(data?.products.map((p) => p.clicks) ?? [0]))

  return (
    <>
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Homepage Views</div>
          <div className={styles.cardValue}>{data ? count(data.views) : "-"}</div>
          <div className={styles.muted}>{data ? plural(data.visitors, "visitor", "visitors") : ""}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Avg. View Time</div>
          <div className={styles.cardValue}>{duration(data?.avgActiveSeconds)}</div>
          <div className={styles.muted}>Active time, tab visible</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Views With a Click</div>
          <div className={styles.cardValue}>{data && views ? percent(data.viewsWithClick / views) : "-"}</div>
          <div className={styles.muted}>{data ? `${count(data.viewsWithClick)} of ${plural(views, "view", "views")}` : ""}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Most Clicked</div>
          <div className={styles.cardValueSmall}>{data?.elements[0]?.element ?? "-"}</div>
          <div className={styles.muted}>{data?.elements[0] ? plural(data.elements[0].clicks, "click", "clicks") : ""}</div>
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.grid2}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>How long people stay on the homepage</div>
          {data?.timeBuckets.map((b) => (
            <div className={styles.barRow} key={b.label}>
              <span className={styles.barLabel}>{b.label}</span>
              <div className={styles.barTrack}>
                <div
                  className={b.label === NOT_MEASURED ? styles.barFillMuted : styles.barFill}
                  style={{ width: `${(b.views / maxBucket) * 100}%` }}
                />
              </div>
              <span className={styles.barValue}>
                {count(b.views)} <span className={styles.muted}>{views ? percent(b.views / views) : ""}</span>
              </span>
            </div>
          ))}
          {data && (
            <div className={styles.muted}>Not measured: the tab closed before the time on page reached us, common on phones.</div>
          )}
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Products clicked from the homepage</div>
          {data?.products.map((p) => (
            <div className={styles.barRow} key={p.productId}>
              <span className={styles.barLabel}>{p.productName}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${(p.clicks / maxProduct) * 100}%` }} />
              </div>
              <span className={styles.barValue}>{count(p.clicks)}</span>
            </div>
          ))}
          {data && data.products.length === 0 && <div className={styles.muted}>No product clicks yet.</div>}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Element</th><th>Clicks</th><th>Views with a click</th><th>Click-through rate</th></tr>
          </thead>
          <tbody>
            {data?.elements.map((e) => (
              <tr key={e.element}>
                <td><code className={styles.tag}>{e.element}</code></td>
                <td className={styles.num}>{count(e.clicks)}</td>
                <td className={styles.num}>{count(e.viewsWithClick)}</td>
                <td className={styles.meterCell}>
                  <div className={styles.meterLine}>
                    <b>{percent(e.clickThroughRate)}</b><span className={styles.muted}>of homepage views</span>
                  </div>
                  <div className={styles.meter}>
                    <div className={styles.meterFill} style={{ width: `${Math.round((e.clickThroughRate ?? 0) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.elements.length === 0 && <div className={styles.empty}>No homepage clicks for these dates yet.</div>}
      </div>
    </>
  )
}
