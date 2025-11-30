"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

export default function SofaRevealSection() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isTextVisible, setIsTextVisible] = useState(false)

  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = sectionRef.current.offsetHeight
      const windowHeight = window.innerHeight

      // Calculate scroll progress through this section
      const sectionTop = rect.top
      const sectionBottom = rect.bottom 
      // Toggle visibility of text
      setIsTextVisible(sectionTop <= windowHeight / 2 && sectionBottom >= windowHeight / 2)

      // Animation active when section is in viewport
      if (sectionTop <= windowHeight && sectionBottom >= 0) {
        // Calculate progress (0 to 1) based on section scroll
        const scrolled = windowHeight - sectionTop
        const progress = Math.min(Math.max(scrolled / (sectionHeight + windowHeight), 0), 1)
        setScrollProgress(progress)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate image position - starts from bottom (100vh) and moves to top (0vh)
  // But stops at -10vh (slightly above center)
  const imageTranslateY = Math.max(100 - scrollProgress * 110, 100)
  const textOpacity = Math.max(1 - (scrollProgress - 0.6) * 15, 0)

  return (
    // Parent div - Section container
    <div ref={sectionRef} className="relative min-h-[200vh] isolate z-10 bg-gray-50 overflow-hidden" id="sofa-reveal-section">
      <div className="sticky top-0 h-screen  ">
        {/* First child div - Fixed text */}
{isTextVisible && (
          <div
            className="fixed inset-0 flex items-center justify-center z-20 px-6 pointer-events-none"
            style={{ opacity: textOpacity }}
          >
            <h2
              className="text-4xl md:text-6xl lg:text-6xl font-bold leading-tight text-center text-[#18395c] max-w-7xl mx-auto"
              style={{ fontFamily: "Gill, sans-serif" }}
            >
              OUR SOFA COLLECTION BLENDS MODERN SCANDINAVIAN DESIGN WITH SCULPTURAL FORMS, ENHANCING ANY SPACE WITH
              COMFORT AND STYLE.
            </h2>
          </div>
        )}

        {/* Second child div - Moving image */}
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{
            transform: `translateY(${imageTranslateY}vh)`,
          }}
        >
          <div className="w-full max-w-8xl mx-auto px-8">
            <Image
              src="/assets/images/reveal-sofa.webp"
              alt="Modern Scandinavian Sofa"
              width={1800}
              height={756}
              className="w-full h-auto object-contain"
              priority
            />

            {/* Button that appears when image reaches final position */}
            <div
              className="flex justify-center mt-8"
              style={{
                opacity: Math.max((scrollProgress - 0.5) * 15, 0),
              }}
            >
              <button className="bg-[#18395c] text-white px-8 py-4 rounded-full font-medium hover:bg-[#7A4234] transition-all duration-300 shadow-lg">
                VIEW OUR SOFAS COLLECTION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
