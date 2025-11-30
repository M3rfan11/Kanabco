"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Minus,
  Plus,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Facebook,
  Twitter,
  Mail,
  ArrowRight,
  Headphones,
} from "lucide-react"

interface ProductImage {
  id: string
  src: string
  alt: string
}

interface ColorOption {
  name: string
  value: string
  images: ProductImage[]
}

const productImages: ProductImage[] = [
  {
    id: "main",
    src: "/assets/images/chair1.webp",
    alt: "Flow Side Chair - Brown - Main View",
  },
  {
    id: "office",
    src: "/assets/images/chair2.webp",
    alt: "Flow Side Chair in Office Setting",
  },
  {
    id: "desk",
    src: "/assets/images/chair3.webp",
    alt: "Flow Side Chair at Desk",
  },
  {
    id: "detail",
    src: "/assets/images/chair4.webp",
    alt: "Flow Side Chair Detail View",
  },
]

const colorOptions: ColorOption[] = [
  {
    name: "Warm Brown",
    value: "#8B4513",
    images: productImages,
  },
  {
    name: "Deep Navy",
    value: "#1e293b",
    images: [
      {
        id: "navy-main",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair - Navy - Main View",
      },
      {
        id: "navy-office",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair Navy in Office",
      },
      {
        id: "navy-desk",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair Navy at Desk",
      },
      {
        id: "navy-detail",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair Navy Detail",
      },
    ],
  },
  {
    name: "Charcoal",
    value: "#374151",
    images: [
      {
        id: "charcoal-main",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair - Charcoal - Main View",
      },
      {
        id: "charcoal-office",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair Charcoal in Office",
      },
      {
        id: "charcoal-desk",
        src: "/placeholder.svg?height=800&width=800&text=Charcoal+Chair+Desk",
        alt: "Flow Side Chair Charcoal at Desk",
      },
      {
        id: "charcoal-detail",
        src: "/assets/images/Chair.jpg",
        alt: "Flow Side Chair Charcoal Detail",
      },
    ],
  },
]

export default function ModernProductDetail() {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(colorOptions[0])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const leftSectionRef = useRef<HTMLDivElement>(null)
  const productInfoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const middleSentinelRef = useRef<HTMLDivElement>(null)

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }

  const handleColorChange = (color: ColorOption) => {
    setSelectedColor(color)
    setSelectedImageIndex(0)
  }

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    }

    // Observer for when the container comes into view
    const containerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (containerRef.current && productInfoRef.current) {
          if (entry.isIntersecting) {
            productInfoRef.current.style.position = "sticky"
            productInfoRef.current.style.top = "5rem"
          }
        }
      })
    }, observerOptions)

    // Observer for the middle of the left section
    const middleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (productInfoRef.current) {
          if (entry.isIntersecting) {
            // When middle sentinel is visible, release sticky positioning
            productInfoRef.current.style.position = "relative"
            productInfoRef.current.style.top = "auto"
          } else {
            // When middle sentinel is not visible, maintain sticky positioning
            productInfoRef.current.style.position = "sticky"
            productInfoRef.current.style.top = "5rem"
          }
        }
      })
    }, observerOptions)

    // Create and position the middle sentinel
    const createMiddleSentinel = () => {
      if (leftSectionRef.current) {
        const sentinel = document.createElement("div")
        sentinel.style.height = "1px"
        sentinel.style.width = "100%"
        sentinel.style.visibility = "hidden"
        sentinel.style.position = "absolute"

        // Position the sentinel at 75% of the left section instead of 50%
        const leftSectionHeight = leftSectionRef.current.offsetHeight
        sentinel.style.top = `${leftSectionHeight * 0.75}px`

        leftSectionRef.current.style.position = "relative" // Make sure parent is positioned
        leftSectionRef.current.appendChild(sentinel)
        middleSentinelRef.current = sentinel

        return sentinel
      }
      return null
    }

    // Observe the elements
    if (containerRef.current) {
      containerObserver.observe(containerRef.current)
    }

    const middleSentinel = createMiddleSentinel()
    if (middleSentinel) {
      middleObserver.observe(middleSentinel)
    }

    // Recalculate middle position on window resize
    const handleResize = () => {
      if (middleSentinelRef.current && leftSectionRef.current) {
        const leftSectionHeight = leftSectionRef.current.offsetHeight
        middleSentinelRef.current.style.top = `${leftSectionHeight * 0.75}px`
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      containerObserver.disconnect()
      middleObserver.disconnect()
      window.removeEventListener("resize", handleResize)

      if (
        middleSentinelRef.current &&
        leftSectionRef.current &&
        leftSectionRef.current.contains(middleSentinelRef.current)
      ) {
        leftSectionRef.current.removeChild(middleSentinelRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white content-with-nav">
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div  className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Product Images */}
          <div ref={leftSectionRef} className="space-y-6">
            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 gap-4">
              {selectedColor.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className=" bg-white rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    width={700}
                    height={910}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>


          </div>

          {/* Right Side - Product Details */}
          <div  className="relative">
            <div  className="bg-white p-8 space-y-6 pt-5 rounded-t-4xl sticky top-20">
              {/* Category */}
              <p className="text-sm text-gray-600 font-light">Seating</p>

              {/* Product Title and Price */}
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-light text-gray-900 tracking-wide">FLOW SIDE CHAIR</h1>
                <p className="text-xl font-light text-gray-900">LE 62,483.00</p>
              </div>

              {/* Product Description */}
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                The Flow Side Chair brings a new perspective to the iconic shell chair through its innovative composite
                of wood fibers and 100% recycled plastic.
              </p>

              {/* Color Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Color:</span>
                  <span className="text-sm text-gray-900">{selectedColor.name}</span>
                </div>
                <div className="flex gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-full border transition-all ${
                        selectedColor.name === color.name ? "border-gray-800 border-2" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  Hurry, only <span className="font-medium">11 items</span> left in stock!
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-[#18395c] h-1 rounded-full" style={{ width: "20%" }}></div>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-full">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 hover:bg-gray-50 rounded-l-full transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 hover:bg-gray-50 rounded-r-full transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    className="flex-1 py-3 rounded-full text-white font-medium text-sm tracking-wide hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#18395c" }}
                  >
                    ADD TO CART
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-3 rounded-full border border-gray-300 text-gray-900 hover:bg-gray-50 font-medium text-sm tracking-wide bg-transparent"
                >
                  BUY IT NOW
                </Button>
              </div>

              {/* Pickup Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pickup available at German Warehouse</span>
                </div>
                <button className="text-sm text-gray-500 hover:text-gray-700 underline">
                  Check availability at other stores
                </button>
              </div>
              <p className="text-sm text-gray-500">Usually ready in 24 hours</p>

              {/* Social Share */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Share:</span>
                  <div className="flex gap-3">
                    <button className="w-6 h-6 flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center">
                      <Twitter className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                  <span>Need help?</span>
                </button>
              </div>

              {/* Product Features */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">In stock! Ships within 1-2 business days</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">90-day call-back trial</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">2-Year Warranty</span>
                </div>
                <div className="flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Complimentary shipping & returns</span>
                </div>
              </div>

              {/* View Full Details */}
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors pt-4">
                View full details
                <ArrowRight className="w-4 h-4" />
              </button>


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
