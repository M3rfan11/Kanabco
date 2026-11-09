"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { captureUtm } from "@/lib/tracking"
import { pageFromPath, startClickTracking, trackPageView } from "@/lib/pageTracking"

/** Rendered once in the root layout: keeps the visit's UTM tags, records each page view, and homepage clicks. */
export default function TrackingInit() {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname || !pageFromPath(pathname)) return
    captureUtm()
    trackPageView(pathname)
    if (pageFromPath(pathname)?.pageType === "home") return startClickTracking()
  }, [pathname])
  return null
}
