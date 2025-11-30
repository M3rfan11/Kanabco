"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Heart, Share2, Truck, Shield, RotateCcw, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Navigation from "@/app/components/navigation"
import Footer from "@/app/components/footer"


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
    src: "/placeholder.svg?height=600&width=600&text=Brown+Chair+Main",
    alt: "Flow Side Chair - Brown - Main View",
  },
  {
    id: "office",
    src: "/placeholder.svg?height=600&width=600&text=Brown+Chair+Office",
    alt: "Flow Side Chair in Office Setting",
  },
  {
    id: "desk",
    src: "/placeholder.svg?height=600&width=600&text=Brown+Chair+Desk",
    alt: "Flow Side Chair at Desk",
  },
  {
    id: "meeting",
    src: "/placeholder.svg?height=600&width=600&text=Brown+Chairs+Meeting",
    alt: "Flow Side Chairs in Meeting Room",
  },
]

const colorOptions: ColorOption[] = [
  {
    name: "Brown",
    value: "#8B4513",
    images: productImages,
  },
  {
    name: "Navy",
    value: "#18395c",
    images: [
      {
        id: "navy-main",
        src: "/placeholder.svg?height=600&width=600&text=Navy+Chair+Main",
        alt: "Flow Side Chair - Navy - Main View",
      },
      {
        id: "navy-office",
        src: "/placeholder.svg?height=600&width=600&text=Navy+Chair+Office",
        alt: "Flow Side Chair Navy in Office",
      },
    ],
  },
]

const reviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2024-01-15",
    comment: "Absolutely love this chair! The quality is exceptional and it's incredibly comfortable.",
  },
  {
    id: 2,
    author: "David L.",
    rating: 4,
    date: "2024-01-10",
    comment: "Great design and build quality. Delivery was fast and packaging was excellent.",
  },
]

export default function ProductPage({ params }: { params: { id: string } }) {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(colorOptions[0])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "shipping">("description")

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }

  const handleColorChange = (color: ColorOption) => {
    setSelectedColor(color)
    setSelectedImageIndex(0)
  }

  const addToCart = () => {
    // Add to cart logic here
    console.log("Added to cart:", { productId: params.id, color: selectedColor.name, quantity })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm font-gill-sans text-gray-600">
            <Link href="/" className="hover:text-burnt-orange">
              Home
            </Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-burnt-orange">
              Collections
            </Link>
            <span>/</span>
            <Link href="/collections?category=Seating" className="hover:text-burnt-orange">
              Seating
            </Link>
            <span>/</span>
            <span className="text-gray-900">Flow Side Chair</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm relative">
              <Image
                src={selectedColor.images[selectedImageIndex]?.src || "/placeholder.svg"}
                alt={selectedColor.images[selectedImageIndex]?.alt || "Product Image"}
                fill
                className="object-cover"
              />

              {/* Image Navigation */}
              {selectedColor.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === 0 ? selectedColor.images.length - 1 : prev - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) => (prev === selectedColor.images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-4">
              {selectedColor.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                    selectedImageIndex === index ? "ring-2 ring-burnt-orange" : "hover:shadow-md"
                  }`}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="space-y-8">
            {/* Product Header */}
            <div>
              <p className="text-sm text-gray-500 font-gill-sans tracking-wide mb-2">Seating</p>
              <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">FLOW SIDE CHAIR</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600 font-gill-sans">(24 reviews)</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">LE 62,483.00</p>
            </div>

            {/* Product Description */}
            <p className="text-gray-600 font-gill-sans leading-relaxed">
              The Flow Side Chair brings a new perspective to the iconic shell chair through its innovative composite of
              wood fibers and 100% recycled plastic. Designed for ultimate comfort and sustainability.
            </p>

            {/* Color Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-gill-sans text-gray-700">Color:</span>
                <span className="text-sm font-gill-sans font-medium text-gray-900">{selectedColor.name}</span>
              </div>
              <div className="flex gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorChange(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor.name === color.name
                        ? "border-gray-800 scale-110"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-full">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 hover:bg-gray-100 rounded-l-full transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 font-gill-sans font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 hover:bg-gray-100 rounded-r-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={addToCart}
                  className="flex-1 py-4 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#8B4B6B" }}
                >
                  ADD TO CART
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 py-4 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-gill-sans font-semibold tracking-wide bg-transparent"
                >
                  BUY IT NOW
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 border-gray-300 bg-transparent"
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2 border-gray-300 bg-transparent"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 font-gill-sans">Free shipping on orders over LE 10,000</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 font-gill-sans">2-Year Warranty</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 font-gill-sans">30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {["description", "reviews", "shipping"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-gill-sans font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? "border-burnt-orange text-burnt-orange"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-oblong font-bold mb-4">Product Description</h3>
                <p className="text-gray-600 font-gill-sans leading-relaxed mb-4">
                  The Flow Side Chair represents the perfect fusion of sustainability and design excellence. Crafted
                  from an innovative composite of wood fibers and 100% recycled plastic, this chair offers both
                  environmental responsibility and exceptional durability.
                </p>
                <h4 className="text-lg font-oblong font-bold mb-2">Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 font-gill-sans">
                  <li>Made from 100% recycled plastic and wood fibers</li>
                  <li>Ergonomic design for maximum comfort</li>
                  <li>Stackable for easy storage</li>
                  <li>Suitable for both indoor and outdoor use</li>
                  <li>Easy to clean and maintain</li>
                </ul>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h3 className="text-xl font-oblong font-bold mb-6">Customer Reviews</h3>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-gill-sans font-medium">{review.author}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 font-gill-sans">{review.date}</span>
                      </div>
                      <p className="text-gray-600 font-gill-sans">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h3 className="text-xl font-oblong font-bold mb-4">Shipping Information</h3>
                <div className="space-y-4 text-gray-600 font-gill-sans">
                  <p>
                    <strong>Free Shipping:</strong> On orders over LE 10,000
                  </p>
                  <p>
                    <strong>Standard Delivery:</strong> 3-5 business days (LE 150)
                  </p>
                  <p>
                    <strong>Express Delivery:</strong> 1-2 business days (LE 300)
                  </p>
                  <p>
                    <strong>Same Day Delivery:</strong> Available in Cairo and Giza (LE 500)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
