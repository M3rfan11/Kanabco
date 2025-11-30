"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Filter, Grid, List, Star } from "lucide-react"
import Navigation from "@/app/components/navigation"
import Footer from "@/app/components/footer"


interface Product {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  colors: string[]
  rating: number
  reviewCount: number
  soldCount: number
}

const bestSellingProducts: Product[] = [
  {
    id: "flow-side-chair-bestseller",
    name: "Flow Side Chair",
    category: "Seating",
    price: 62483.0,
    image: "/placeholder.svg?height=400&width=300&text=Flow+Side+Chair",
    colors: ["Brown", "Navy", "Gray"],
    rating: 4.8,
    reviewCount: 127,
    soldCount: 450,
  },
  {
    id: "embrace-lounge-sofa-bestseller",
    name: "Embrace Lounge Sofa",
    category: "Sofas",
    price: 324062.0,
    originalPrice: 380000.0,
    discount: 15,
    image: "/placeholder.svg?height=400&width=300&text=Embrace+Lounge+Sofa",
    colors: ["Beige", "Navy", "Gray"],
    rating: 4.9,
    reviewCount: 89,
    soldCount: 230,
  },
  {
    id: "minimalist-coffee-table-bestseller",
    name: "Minimalist Coffee Table",
    category: "Tables",
    price: 15000.0,
    image: "/placeholder.svg?height=400&width=300&text=Minimalist+Coffee+Table",
    colors: ["Oak", "Walnut", "Black"],
    rating: 4.7,
    reviewCount: 203,
    soldCount: 680,
  },
  {
    id: "scandinavian-floor-lamp-bestseller",
    name: "Scandinavian Floor Lamp",
    category: "Lighting",
    price: 18500.0,
    originalPrice: 21000.0,
    discount: 12,
    image: "/placeholder.svg?height=400&width=300&text=Scandinavian+Floor+Lamp",
    colors: ["Natural Wood", "Black", "White"],
    rating: 4.6,
    reviewCount: 156,
    soldCount: 340,
  },
  {
    id: "modern-accent-chair-bestseller",
    name: "Modern Accent Chair",
    category: "Seating",
    price: 4250.0,
    originalPrice: 5000.0,
    discount: 15,
    image: "/placeholder.svg?height=400&width=300&text=Modern+Accent+Chair",
    colors: ["Orange", "Navy", "Gray"],
    rating: 4.5,
    reviewCount: 94,
    soldCount: 520,
  },
  {
    id: "ceramic-vase-set-bestseller",
    name: "Ceramic Vase Set",
    category: "Home Decors",
    price: 6800.0,
    originalPrice: 7500.0,
    discount: 9,
    image: "/placeholder.svg?height=400&width=300&text=Ceramic+Vase+Set",
    colors: ["White", "Terracotta", "Navy"],
    rating: 4.4,
    reviewCount: 78,
    soldCount: 290,
  },
]

const sortOptions = ["Best Selling", "Price: Low to High", "Price: High to Low", "Highest Rated"]
const categories = ["All Categories", "Seating", "Sofas", "Tables", "Lighting", "Home Decors"]

export default function BestSellingCollectionPage() {
  const [sortBy, setSortBy] = useState("Best Selling")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All Categories")

  const filteredProducts = bestSellingProducts.filter(
    (product) => selectedCategory === "All Categories" || product.category === selectedCategory,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-[#18395c]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">BEST SELLING</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Customer favorites and top picks! Discover our most popular furniture pieces loved by thousands of
              customers for their exceptional quality, design, and value.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm font-gill-sans text-gray-600 mb-8">
          <Link href="/" className="hover:text-burnt-orange">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-burnt-orange">
            Collections
          </Link>
          <span>/</span>
          <span className="text-gray-900">Best Selling</span>
        </nav>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-gill-sans whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-burnt-orange text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <span className="text-gray-600 font-gill-sans">{filteredProducts.length} bestsellers</span>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-gray-200" : "bg-white"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-gray-200" : "bg-white"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-gill-sans"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <div className={`relative bg-gray-100 ${viewMode === "list" ? "w-48 h-48" : "aspect-[3/4]"}`}>
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Bestseller
                  </div>
                  {product.discount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Save {product.discount}%
                    </div>
                  )}
                </div>
                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <p className="text-xs uppercase text-gray-500 font-gill-sans tracking-widest mb-1">
                    {product.category}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 font-gill-sans mb-2">{product.name}</h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-gill-sans">
                      {product.rating} ({product.reviewCount})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-gray-900">
                      LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        LE {product.originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 font-gill-sans mb-2">{product.soldCount}+ sold</p>

                  <div className="flex gap-1">
                    {product.colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.toLowerCase().replace(" ", "") }}
                        title={color}
                      />
                    ))}
                    {product.colors.length > 3 && (
                      <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="px-8 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:border-burnt-orange hover:text-burnt-orange font-gill-sans font-semibold bg-transparent"
          >
            Load More Products
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
