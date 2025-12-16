"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Filter, Grid, List, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import Navigation from "@/app/components/navigation"
import Footer from "@/app/components/footer"
import { useCart } from "@/app/contexts/CartContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface ProductVariant {
  id: number
  productId: number
  color: string
  colorHex?: string | null
  attributes?: string | null
  imageUrl?: string | null
  mediaUrls?: string | null
  priceOverride?: number | null
  sku?: string | null
  isActive: boolean
  isAvailable?: boolean
  isOutOfStock?: boolean
}

interface Product {
  id: number
  name: string
  price: number
  compareAtPrice?: number | null
  imageUrl: string | null
  colors: string[]
  variants: ProductVariant[]
  variantAttributes?: string | null
  categoryName: string
  isActive: boolean
}

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"]

export default function RoomsCollectionPage() {
  const { addToCart: addItemToCart } = useCart()
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant | null>>({})
  const [productImageIndex, setProductImageIndex] = useState<Record<number, number>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/Product?includeDrafts=false&categoryName=ROOMS`)
      if (response.ok) {
        const data = await response.json()
        const mappedProducts = data
          .filter((p: any) => p.isActive)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            imageUrl: p.imageUrl,
            colors: p.colors || [],
            variants: p.variants || [],
            variantAttributes: p.variantAttributes,
            categoryName: p.categoryName,
            isActive: p.isActive,
          }))
        setProducts(mappedProducts)
      } else {
        console.error("Failed to fetch products:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDiscount = (price: number, compareAtPrice?: number | null) => {
    if (!compareAtPrice || compareAtPrice <= price) return null
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  }

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "Price: Low to High":
        return a.price - b.price
      case "Price: High to Low":
        return b.price - a.price
      case "Newest":
        return b.id - a.id
      default:
        return 0
    }
  })

  const handleAddToCart = (product: Product, variant: ProductVariant | null) => {
    const variantId = variant?.id || 0
    const color = variant?.color || variant?.attributes ? (() => {
      try {
        const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
        return Object.values(attrs)[0] as string || "Default"
      } catch {
        return "Default"
      }
    })() : "Default"
    
    addItemToCart({
      productId: product.id,
      variantId: variantId,
      name: product.name,
      color: color,
      size: null,
      price: variant?.priceOverride || product.price,
      quantity: 1,
      image: variant?.imageUrl || product.imageUrl || "/placeholder.svg",
      sku: variant?.sku || null
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">ROOMS</h1>
          <p className="text-gray-600 font-gill-sans text-lg">
            Complete room solutions for modern living
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="font-gill-sans"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
        </div>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 font-gill-sans">No products found in this category.</p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            }`}
          >
            {sortedProducts.map((product) => {
              const discount = getDiscount(product.price, product.compareAtPrice)
              const imageUrl = product.imageUrl || "/placeholder.svg?height=400&width=300&text=" + encodeURIComponent(product.name)
              const selectedVariant = selectedVariants[product.id] || product.variants[0] || null
              
              return (
                <Link href={`/product/${product.id}`} key={product.id}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Save {discount}%
                        </div>
                      )}
                      <Button
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#ed6b3e] hover:bg-[#d55a2e] text-white"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product, selectedVariant)
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <p className="text-xs uppercase text-[#18395c] font-gill-sans tracking-widest mb-1">
                        {product.categoryName}
                      </p>
                      <h3 className="text-lg font-medium text-[#18395c] font-gill-sans mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-lg font-bold text-[#18395c]">
                          LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            LE {product.compareAtPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}




