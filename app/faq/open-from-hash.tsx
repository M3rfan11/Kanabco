"use client"

import { useEffect } from "react"

/** A link to /faq#warranty opens that question, not only scrolls to it. */
export default function OpenFromHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id) return
      const target = document.getElementById(id)
      if (target instanceof HTMLDetailsElement) {
        target.open = true
        target.scrollIntoView({ block: "start" })
      }
    }
    open()
    window.addEventListener("hashchange", open)
    return () => window.removeEventListener("hashchange", open)
  }, [])
  return null
}
