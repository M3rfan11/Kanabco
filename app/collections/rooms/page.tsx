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
  price: number
  originalPrice?: number
  discount?: number
  image: string
  includes: string[]
  roomType: string
}

const roomProducts: Product[] = [
  {
    id: "modern-living-room-set",
    name: "Modern Living Room Set",
    price: 850000.0,
    originalPrice: 950000.0,
    discount: 11,
    image: "/placeholder.svg?height=400&width=300&text=Modern+Living+Room+Set",
    includes: ["3-Seat Sofa", "2 Armchairs", "Coffee Table", "Side Table"],
    roomType: "Living Room",
  },
  {
    id: "scandinavian-bedroom-collection",
    name: "Scandinavian Bedroom Collection",
    price: 650000.0,
    image: "/placeholder.svg?height=400&width=300&text=Scandinavian+Bedroom+Collection",
    includes: ["King Bed", "2 Nightstands", "Dresser", "Wardrobe"],
    roomType: "Bedroom",
  },
  {
    id: "executive-office-suite",
    name: "Executive Office Suite",
    price: 420000.0,
    originalPrice: 480000.0,
    discount: 13,
    image: "/placeholder.svg?height=400&width=300&text=Executive+Office+Suite",
    includes: ["Executive Desk", "Office Chair", "Bookshelf", "Filing Cabinet"],
    roomType: "Office",
  },
  {
    id: "contemporary-dining-set",
    name: "Contemporary Dining Set",
    price: 380000.0,
    image: "/placeholder.svg?height=400&width=300&text=Contemporary+Dining+Set",
    includes: ["Dining Table", "6 Dining Chairs", "Buffet", "Bar Cart"],
    roomType: "Dining Room",
  },
  {
    id: "minimalist-home-office",
    name: "Minimalist Home Office",
    price: 280000.0,
    originalPrice: 320000.0,
    discount: 13,
    image: "/placeholder.svg?height=400&width=300&text=Minimalist+Home+Office",
    includes: ["Standing Desk", "Ergonomic Chair", "Storage Unit", "Desk Lamp"],
    roomType: "Home Office",
  },
  {
    id: "luxury-master-bedroom",
    name: "Luxury Master Bedroom",
    price: 950000.0,
    image: "/placeholder.svg?height=400&width=300&text=Luxury+Master+Bedroom",
    includes: ["King Bed", "2 Nightstands", "Dresser", "Bench", "Armchair"],
    roomType: "Master Bedroom",
  },
]

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"]
const roomTypes = ["All Rooms", "Living Room", "Bedroom", "Office", "Dining Room", "Home Office", "Master Bedroom"]

export default function RoomsCollectionPage() {
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRoomType, setSelectedRoomType] = useState("All Rooms")

  const filteredProducts = roomProducts.filter(
    (product) => selectedRoomType === "All Rooms" || product.roomType === selectedRoomType,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-[#18395c]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">ROOMS COLLECTION</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Complete room solutions for modern living! Discover our curated room sets that bring together perfectly
              matched furniture pieces for a cohesive, stylish look.
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
          <span className="text-gray-900">Rooms</span>
        </nav>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            {/* Room Type Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {roomTypes.map((roomType) => (
                <button
                  key={roomType}
                  onClick={() => setSelectedRoomType(roomType)}
                  className={`px-4 py-2 rounded-full text-sm font-gill-sans whitespace-nowrap transition-colors ${
                    selectedRoomType === roomType
                      ? "bg-burnt-orange text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {roomType}
                </button>
              ))}
            </div>

            <span className="text-gray-600 font-gill-sans">{filteredProducts.length} room sets</span>
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
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <div className={`relative bg-gray-100 ${viewMode === "list" ? "w-64 h-48" : "aspect-[4/3]"}`}>
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  {product.discount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Save {product.discount}%
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-burnt-orange text-white text-xs font-medium px-3 py-1 rounded-full">
                    {product.roomType}
                  </div>
                </div>
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <p className="text-xs uppercase text-gray-500 font-gill-sans tracking-widest mb-1">Room Set</p>
                  <h3 className="text-lg font-medium text-gray-900 font-gill-sans mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-gray-900">
                      LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        LE {product.originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-gill-sans font-medium text-gray-700 mb-2">Includes:</p>
                    <ul className="text-sm text-gray-600 font-gill-sans space-y-1">
                      {product.includes.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-burnt-orange rounded-full mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
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
            Load More Room Sets
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
