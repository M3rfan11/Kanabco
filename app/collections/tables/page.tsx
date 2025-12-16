"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Filter, Grid, List } from "lucide-react"
import Navigation from "@/app/components/navigation"
import Footer from "@/app/components/footer"

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

export default function TablesCollectionPage() {
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/Product?includeDrafts=false&categoryName=TABLES`)
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

    fetchProducts()
  }, [])

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

  const getDiscount = (price: number, compareAtPrice?: number | null) => {
    if (!compareAtPrice || compareAtPrice <= price) return null
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-[#18395c]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">
              TABLES COLLECTION
            </h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Surfaces that define your space! Discover our extensive collection of dining tables, coffee tables, desks,
              and more - crafted to be both functional and beautiful.
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
          <span className="text-gray-900">Tables</span>
        </nav>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <span className="text-gray-600 font-gill-sans">{products.length} products</span>
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-gill-sans">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
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
              
              return (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative bg-gray-100 ${viewMode === "list" ? "w-48 h-48" : "aspect-[3/4]"}`}>
                      <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                      {discount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Save {discount}%
                        </div>
                      )}
                    </div>
                    <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <p className="text-xs uppercase text-gray-500 font-gill-sans tracking-widest mb-1">Tables</p>
                      <h3 className="text-lg font-medium text-gray-900 font-gill-sans mb-2">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            LE {product.compareAtPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      {product.variants && product.variants.length > 0 && (() => {
                        let attributeNames: string[] = []
                        try {
                          if (product.variantAttributes) {
                            attributeNames = typeof product.variantAttributes === 'string' 
                              ? JSON.parse(product.variantAttributes) 
                              : product.variantAttributes
                          }
                        } catch {
                          if (product.variants[0]?.attributes) {
                            try {
                              const attrs = typeof product.variants[0].attributes === 'string'
                                ? JSON.parse(product.variants[0].attributes)
                                : product.variants[0].attributes
                              attributeNames = Object.keys(attrs || {})
                            } catch {
                              attributeNames = ["Color"]
                            }
                          }
                        }
                        
                        const colorAttrName = attributeNames[0] || "Color"
                        const sizeAttrName = attributeNames.length > 1 ? attributeNames[1] : (attributeNames.includes("Size") ? "Size" : null)
                        
                        const availableColors = new Set<string>()
                        const availableSizes = new Set<string>()
                        
                        product.variants.forEach((variant: ProductVariant) => {
                          if (variant.isAvailable === false) return
                          
                          try {
                            let attrs: Record<string, string> = {}
                            if (variant.attributes) {
                              attrs = typeof variant.attributes === 'string' 
                                ? JSON.parse(variant.attributes) 
                                : variant.attributes
                            }
                            
                            const colorValue = attrs[colorAttrName] || variant.color || ""
                            if (colorValue) availableColors.add(colorValue)
                            
                            if (sizeAttrName && attrs[sizeAttrName]) {
                              availableSizes.add(attrs[sizeAttrName])
                            }
                          } catch {}
                        })
                        
                        return (
                          <div className="pt-2 border-t border-gray-200 space-y-2">
                            {availableColors.size > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 font-gill-sans mb-1">Colors:</p>
                                <div className="flex flex-wrap gap-2">
                                  {Array.from(availableColors).map((color, idx) => {
                                    const colorVariant = product.variants.find((v: ProductVariant) => {
                                      try {
                                        if (v.attributes) {
                                          const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
                                          return (attrs[colorAttrName] || v.color) === color
                                        }
                                        return v.color === color
                                      } catch {
                                        return v.color === color
                                      }
                                    })
                                    const colorHex = colorVariant?.colorHex || "#cccccc"
                                    const finalColor = colorHex && colorHex.trim() !== "" 
                                      ? (colorHex.startsWith("#") ? colorHex : `#${colorHex}`)
                                      : "#cccccc"
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 bg-white"
                                        title={color}
                                      >
                                        <div
                                          className="w-4 h-4 rounded-full border border-gray-300"
                                          style={{ backgroundColor: finalColor }}
                                        />
                                        <span className="text-xs text-gray-700 font-gill-sans">{color}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {availableSizes.size > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 font-gill-sans mb-1">Sizes:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.from(availableSizes).sort().map((size, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 text-xs font-gill-sans text-gray-700 bg-gray-100 rounded border border-gray-200"
                                    >
                                      {size}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

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