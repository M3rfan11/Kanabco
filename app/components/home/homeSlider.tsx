"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"

const slides = [
  {
    image: "/assets/images/hero1.png",
    heading: "COMFORT, STYLE, DURABILITY: OUR SEATING COLLECTION",
    buttonText: "SHOP SEATING",
    buttonLink: "/collections/seating",
  },
  {
    image: "/assets/images/hero2.jpg",
    heading: "ELEVATE YOUR SPACE WITH MODERN DESIGN",
    buttonText: "SHOP SOFAS",
    buttonLink: "/collections/sofas",
  },
]

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<"left" | "right">("right")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showContent, setShowContent] = useState(true)

  const nextSlide = () => {
    if (isAnimating) return
    setDirection("right")
    animateSlide(() => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1)))
  }

  const prevSlide = () => {
    if (isAnimating) return
    setDirection("left")
    animateSlide(() => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1)))
  }

  const animateSlide = (slideChange: () => void) => {
    setIsAnimating(true)
    setShowContent(false)
    setTimeout(() => {
      slideChange()
      setShowContent(true)
    }, 600)
    setTimeout(() => {
      setIsAnimating(false)
    }, 1200)
  }

  // Framer Motion scroll-based transform
  const { scrollY } = useScroll()
  const translateY = useTransform(scrollY, [0, 300], [0, -25]) // adjust values as needed

  return (
    <div className="fixed inset-0 z-0">
      <div className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full h-full">
          <Image
            src={slides[current].image || "/placeholder.svg"}
            alt={`Slide ${current}`}
            fill
            className={`object-cover ${
              showContent
                ? direction === "right"
                  ? "animate-zoomInRight"
                  : "animate-zoomInLeft"
                : ""
            }`}
            priority
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Slide content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            <motion.div style={{ y: translateY }} className="mb-8">
              <Image
                src="/assets/images/logoOW.png"
                alt="KANABCO"
                width={529}
                height={328}
                className={`object-contain max-w-[80%]  mx-auto ${
                  showContent
                    ? direction === "right"
                      ? "animate-slideInRight"
                      : "animate-slideInLeft"
                    : direction === "right"
                      ? "animate-slideOutLeft"
                      : "animate-slideOutRight"
                }`}
              />
            </motion.div>

            <h2
              className={`text-xl md:text-2xl lg:text-3xl font-gill-sans text-white font-light tracking-wide leading-relaxed max-w-4xl ${
                showContent ? "animate-backInUp" : "animate-backOutUp"
              }`}
            >
              {slides[current].heading}
            </h2>

            <Link href={slides[current].buttonLink}>
              <Button
                className={`mt-6 font-gill-sans px-8 py-3 rounded-full text-lg tracking-wide text-white transition-opacity duration-300 ${
                  showContent ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundColor: "#ed6b3e" }}
              >
                {slides[current].buttonText}
              </Button>
            </Link>
          </div>
        </div>

        {/* Arrows */}
        <button
          onClick={prevSlide}
          disabled={isAnimating}
          className="absolute left-24 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center z-10 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: "rgba(24, 57, 92, 0.6)" }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          disabled={isAnimating}
          className="absolute right-24 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center z-10 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: "rgba(24, 57, 92, 0.6)" }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                idx === current ? "bg-[#ed6b3e]" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
