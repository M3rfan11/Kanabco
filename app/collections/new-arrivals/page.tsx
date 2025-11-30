"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Filter, Grid, List } from "lucide-react"
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
  isNew: boolean
}

const newArrivalsProducts: Product[] = [
  {
    id: "silhouette-modern-chair",
    name: "Silhouette Modern Chair",
    category: "Seating",
    price: 42011.0,
    image: "/placeholder.svg?height=400&width=300&text=Silhouette+Modern+Chair",
    colors: ["Charcoal", "Cream", "Navy"],
    isNew: true,
  },
  {
    id: "serene-comfort-sofa",
    name: "Serene Comfort Sofa",
    category: "Sofas",
    price: 324062.0,
    image: "/placeholder.svg?height=400&width=300&text=Serene+Comfort+Sofa",
    colors: ["Light Gray", "Navy", "Beige"],
    isNew: true,
  },
  {
    id: "contemporary-dining-set",
    name: "Contemporary Dining Set",
    category: "Tables",
    price: 185000.0,
    originalPrice: 210000.0,
    discount: 12,
    image: "/placeholder.svg?height=400&width=300&text=Contemporary+Dining+Set",
    colors: ["Oak", "Walnut", "White"],
    isNew: true,
  },
  {
    id: "geometric-pendant-light",
    name: "Geometric Pendant Light",
    category: "Lighting",
    price: 28500.0,
    image: "/placeholder.svg?height=400&width=300&text=Geometric+Pendant+Light",
    colors: ["Brass", "Black", "Copper"],
    isNew: true,
  },
  {
    id: "minimalist-bookshelf",
    name: "Minimalist Bookshelf",
    category: "Storage",
    price: 32000.0,
    originalPrice: 36000.0,
    discount: 11,
    image: "/placeholder.svg?height=400&width=300&text=Minimalist+Bookshelf",
    colors: ["Natural Wood", "White", "Black"],
    isNew: true,
  },
  {
    id: "artisan-ceramic-collection",
    name: "Artisan Ceramic Collection",
    category: "Home Decors",
    price: 8900.0,
    image: "/placeholder.svg?height=400&width=300&text=Artisan+Ceramic+Collection",
    colors: ["Terracotta", "Sage Green", "Cream"],
    isNew: true,
  },
]

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"]
const categories = ["All Categories", "Seating", "Sofas", "Tables", "Lighting", "Storage", "Home Decors"]

export default function NewArrivalsCollectionPage() {
  const [sortBy, setSortBy] = useState("Newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All Categories")

  const filteredProducts = newArrivalsProducts.filter(
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">NEW ARRIVALS</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Fresh designs for modern spaces! Discover our latest furniture pieces and home accessories, featuring the
              newest trends in contemporary design and functionality.
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
          <span className="text-gray-900">New Arrivals</span>
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

            <span className="text-gray-600 font-gill-sans">{filteredProducts.length} new products</span>
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
                  <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    New
                  </div>
                  {product.discount && (
                    <div className="absolute top-4 left-16 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Save {product.discount}%
                    </div>
                  )}
                </div>
                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <p className="text-xs uppercase text-gray-500 font-gill-sans tracking-widest mb-1">
                    {product.category}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 font-gill-sans mb-2">{product.name}</h3>
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
