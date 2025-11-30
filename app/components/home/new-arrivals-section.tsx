"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useRef } from "react"

interface Product {
  id: string
  image: string
  category: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
}

const newArrivalsProducts: Product[] = [
  {
    id: "chair-1",
    image: "/assets/images/new1.webp",
    category: "SEATING",
    name: "SILHOUETTE MODERN CHAIR",
    price: 42011.0,
  },
  {
    id: "sofa-1",
    image: "/assets/images/new2.webp",
    category: "SOFAS",
    name: "SERENE COMFORT SOFA",
    price: 324062.0,
  },
  {
    id: "lamp-1",
    image: "/assets/images/new3.webp",
    category: "LIGHTING",
    name: "AURA PENDANT LAMP",
    price: 35875.0,
    discount: 6,
  },
  {
    id: "carafe-1",
    image: "/assets/images/new4.webp",
    category: "ACCESSORIES",
    name: "VISTA CARAFE",
    price: 4899.0,
    originalPrice: 5200.0,
  },
  {
    id: "chair-2",
    image: "/assets/images/new5.webp",
    category: "SEATING",
    name: "ELEGANT ARMCHAIR",
    price: 55000.0,
  },
  {
    id: "table-1",
    image: "/assets/images/new6.webp",
    category: "TABLES",
    name: "MINIMALIST COFFEE TABLE",
    price: 15000.0,
    discount: 10,
  },
]

export default function NewArrivalsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300 // Adjust as needed
      if (direction === "left") {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  return (
    <div className="bg-white py-16 px-8">
      <div className="max-w-[90%] mx-auto">
        {/* Header and Navigation */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-oblong font-bold mb-4" style={{ color: "#18395c" }}>
              NEW ARRIVALS
            </h2>
            <p className="text-[#18395c] font-gill-sans leading-relaxed">
              Explore our new collection, inspired by the seamless blend of personal and professional spaces in modern
              life. Our versatile and stylish furniture adapts to any setting, providing both elegance and functionality
              for your home.
            </p>
          </div>
          <div className="flex gap-4 mt-8 md:mt-0">
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#ed6b3e] hover:text-[#ed6b3e] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#ed6b3e] hover:text-[#ed6b3e] transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Product Carousel */}
        <div ref={scrollContainerRef} className="flex overflow-hidden hide-scrollbar space-x-6 pb-4  ">
          {newArrivalsProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-72 bg-white rounded-xl overflow-hidden"
            >
              <div className="relative aspect-[3/4] bg-gray-100">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                {product.discount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Save {product.discount}%
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <p className="text-xs uppercase text-[#18395c] font-gill-sans tracking-widest mb-1">
                  {product.category}
                </p>
                <h3 className="text-lg font-medium text-[#18395c] font-gill-sans mb-2">{product.name}</h3>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-lg font-bold text-[#18395c]">
                    LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      LE{" "}
                      {product.originalPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
