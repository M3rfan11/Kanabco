"use client"

import { usePathname } from "next/navigation"
import SidebarSocial from "./SidebarSocial"

export default function ConditionalSidebar() {
  const pathname = usePathname()
  
  // Don't show sidebar on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }
  
  return <SidebarSocial />
}








