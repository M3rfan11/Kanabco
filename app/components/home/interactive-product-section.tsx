"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Facebook, Instagram, TwitterIcon } from "lucide-react"

interface HotspotData {
  id: string
  x: number // percentage from left
  y: number // percentage from top
  title: string
  description: string
  details?: string[]
}

const hotspots: HotspotData[] = [
  {
    id: "chair-material",
    x: 0,
    y: 0,
    title: "PRODUCT MATERIAL",
    description:
      "Seat made of pressed felt with steel reinforcement. Wrap Lounge Chair's shell is clad with multiple layers of foam and wadding and finished with textile upholstery.",

  },
  {
    id: "frame-construction",
    x: 108,
    y: 75,
    title: "FRAME CONSTRUCTION",
    description:
      "Lightweight steel frame creates a striking balance of substantial comfort and visual lightness. Powder-coated finish ensures long-lasting durability.",

  },
]

export default function InteractiveProductSection() {
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)

  return (
    <div className="relative min-h-screen bg-gray-50 ">
      {/* Main Content Container */}
      <div className="relative w-full h-screen rounded-t-4xl overflow-hidden ">
        {/* Full Width Interactive Image */}
        <div className="relative w-full h-full ">
          <Image
            src="/assets/images/lookbook.webp"
            alt="Embrace Lounge Chair in modern living room"
            fill
            className="object-cover"
            priority
          />

          {/* Interactive Hotspots */}
          {hotspots.map((hotspot) => (
            <div key={hotspot.id} className="absolute z-20">
              {/* Hotspot Point */}
              <div
                className="absolute cursor-pointer"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: "translate(1250%, 900%)",
                }}
                onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                {/* Animated Outer Rings */}
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/40 animate-ping animation-delay-0" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/30 animate-ping animation-delay-1000" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/20 animate-ping animation-delay-2000" />

                {/* Main Hotspot Circle with Pulse */}
                <div className="relative w-16 h-16 rounded-full bg-white/95 backdrop-blur-sm border-3 border-white flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-[#18395c] " />
                </div>

                {/* Information Card */}
                {hoveredHotspot === hotspot.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-80 z-30">
                    {/* Card Arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200" />

                    {/* Card Content */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Icon */}
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-[#18395c]/10 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-[#18395c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-[#18395c] font-gill-sans tracking-wide">
                          {hotspot.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm leading-relaxed font-gill-sans mb-4">{hotspot.description}</p>

                      
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Overlay Content - Product Information */}
        <div className="absolute top-0 right-0 w-2/5 h-full flex items-center justify-center bg-gradient-to-l from-black/60 via-black/40 to-transparent px-12 z-10">
          <div className="max-w-lg text-right">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold leading-tight mb-6 text-white">
              MEET THE
              <br />
              EMBRACE
              <br />
              LOUNGE
              <br />
              CHAIR
            </h1>

            <p className="text-white/90 font-gill-sans text-lg leading-relaxed mb-8">
              Designed with an emphasis on ultimate comfort, the chair's spacious form is elegantly supported by a
              lightweight steel frame, creating a striking balance of substantial comfort and visual lightness.
            </p>

            <Button className="px-8 py-4 rounded-full border-2 border-white/60 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-[#18395c] font-gill-sans font-medium tracking-wide transition-all duration-300">
              VIEW FULL DETAILS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
