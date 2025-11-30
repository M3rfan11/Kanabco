"use client"

import { Facebook, Instagram } from "lucide-react"

export default function SidebarSocial() {
  return (
    <div className="fixed top-1/2 left-4 -translate-y-1/2 z-50">
      <div
        className="w-16 h-80 rounded-full flex flex-col items-center justify-center gap-2 p-2 shadow-lg backdrop-blur-sm"
        style={{ backgroundColor: "rgba(24, 57, 92, 0.8)" }}
      >
        {/* Built-in Lucide Icons */}
        {[Facebook, Instagram].map((Icon, index) => (
          <button
            key={index}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "rgba(237, 107, 62, 0.2)" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "rgba(237, 107, 62, 0.4)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "rgba(237, 107, 62, 0.2)")
            }
          >
            <Icon className="w-4 h-4 text-white" />
          </button>
        ))}

        {/* Custom SVG Icon */}
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "rgba(237, 107, 62, 0.2)" }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.backgroundColor = "rgba(237, 107, 62, 0.4)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.backgroundColor = "rgba(237, 107, 62, 0.2)")
          }
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        <div className="writing-mode-vertical text-white text-sm font-gill-sans tracking-wider mt-4">
        <span className="rotate-180" style={{ writingMode: "vertical-rl" }}>
          GET 20% OFF
        </span>
      </div>
      </div>
   

    </div>
  )
}
