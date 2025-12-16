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
  sku?: string | null
}

const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Best Selling"]

export default function SeatingCollectionPage() {
  const { addToCart: addItemToCart } = useCart()
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant | null>>({})
  const [productImageIndex, setProductImageIndex] = useState<Record<number, number>>({})
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({})
  
  const addToCart = (product: Product, variant: ProductVariant | null) => {
    if (!variant) {
      alert("Please select a variant (color and size)")
      return
    }
    
    // Parse variant attributes to get color and size
    let colorName = variant.color || "Default"
    let sizeName: string | null = null
    
    try {
      if (variant.attributes) {
        const attrs = typeof variant.attributes === 'string' 
          ? JSON.parse(variant.attributes) 
          : variant.attributes
        if (attrs && typeof attrs === 'object') {
          const attrKeys = Object.keys(attrs)
          colorName = attrs[attrKeys[0]] || variant.color || "Default"
          sizeName = attrKeys.length > 1 ? attrs[attrKeys[1]] : null
        }
      }
    } catch {}
    
    // Get variant image
    let variantImage = product.imageUrl || "/placeholder.svg"
    try {
      if (variant.mediaUrls) {
        const parsed = typeof variant.mediaUrls === 'string' 
          ? JSON.parse(variant.mediaUrls) 
          : variant.mediaUrls
        if (Array.isArray(parsed) && parsed.length > 0) {
          variantImage = parsed[0]
        }
      } else if (variant.imageUrl) {
        variantImage = variant.imageUrl
      }
    } catch {}
    
    // Add to cart
    addItemToCart({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      color: colorName,
      size: sizeName,
      price: variant.priceOverride || product.price,
      quantity: 1,
      image: variantImage,
      sku: variant.sku || product.sku || null,
    })
    
    alert(`Added ${product.name} to cart!`)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/Product?includeDrafts=false&categoryName=SEATING`)
        if (response.ok) {
          const data = await response.json()
          // Filter only active products and map to our Product interface
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

  // Sort products based on sortBy
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "Price: Low to High":
        return a.price - b.price
      case "Price: High to Low":
        return b.price - a.price
      case "Newest":
        // Assuming newer products have higher IDs (you might want to add createdAt field)
        return b.id - a.id
      case "Best Selling":
        // You might want to add a sales count field
        return 0
      default:
        return 0
    }
  })

  // Calculate discount percentage
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
              SEATING COLLECTION
            </h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Be comfortable. Seat at home! Discover our curated selection of chairs, armchairs, and seating solutions
              designed for ultimate comfort and style.
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
          <span className="text-gray-900">Seating</span>
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
              
              // Get all images from variants and product
              const getAllImages = (): string[] => {
                const images: string[] = []
                const selectedVariant = selectedVariants[product.id]
                
                // If a variant is selected, use its images
                if (selectedVariant) {
                  try {
                    if (selectedVariant.mediaUrls) {
                      const parsed = typeof selectedVariant.mediaUrls === 'string' 
                        ? JSON.parse(selectedVariant.mediaUrls) 
                        : selectedVariant.mediaUrls
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed
                      }
                    }
                    if (selectedVariant.imageUrl) {
                      return [selectedVariant.imageUrl]
                    }
                  } catch {}
                }
                
                // Collect images from all variants (show all variants to customers)
                product.variants?.forEach((variant: ProductVariant) => {
                  // Show all active variants, regardless of availability
                  if (!variant.isActive) return
                  try {
                    if (variant.mediaUrls) {
                      const parsed = typeof variant.mediaUrls === 'string' 
                        ? JSON.parse(variant.mediaUrls) 
                        : variant.mediaUrls
                      if (Array.isArray(parsed)) {
                        parsed.forEach((img: string) => {
                          if (img && !images.includes(img)) images.push(img)
                        })
                      }
                    }
                    if (variant.imageUrl && !images.includes(variant.imageUrl)) {
                      images.push(variant.imageUrl)
                    }
                  } catch {}
                })
                
                // Fallback to product image
                if (images.length === 0 && product.imageUrl) {
                  images.push(product.imageUrl)
                }
                
                return images.length > 0 ? images : ["/placeholder.svg?height=400&width=300&text=" + encodeURIComponent(product.name)]
              }
              
              const allImages = getAllImages()
              const currentImageIndex = productImageIndex[product.id] || 0
              const currentImage = allImages[currentImageIndex] || allImages[0] || product.imageUrl || "/placeholder.svg?height=400&width=300&text=" + encodeURIComponent(product.name)
              
              return (
                <div key={product.id} className="group">
              <div
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                      <Link href={`/product/${product.id}`} className="block">
                        <div className={`relative bg-gray-100 ${viewMode === "list" ? "w-48 h-48" : "aspect-[3/4]"} overflow-hidden`}>
                          <Image src={currentImage} alt={product.name} fill className="object-cover transition-opacity duration-300" />
                          {discount && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full z-10">
                              Save {discount}%
                    </div>
                  )}
                          
                          {/* Image Navigation */}
                          {allImages.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setProductImageIndex({
                                    ...productImageIndex,
                                    [product.id]: currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1
                                  })
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setProductImageIndex({
                                    ...productImageIndex,
                                    [product.id]: currentImageIndex === allImages.length - 1 ? 0 : currentImageIndex + 1
                                  })
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              
                              {/* Image Dots Indicator */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {allImages.slice(0, Math.min(5, allImages.length)).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                      idx === currentImageIndex ? "bg-white" : "bg-white/50"
                                    }`}
                                  />
                                ))}
                                {allImages.length > 5 && (
                                  <span className="text-white text-[10px] ml-1">+{allImages.length - 5}</span>
                                )}
                              </div>
                            </>
                          )}
                </div>
                      </Link>
                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <p className="text-xs uppercase text-gray-500 font-gill-sans tracking-widest mb-1">Seating</p>
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
                        // Parse variant attributes
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
                        
                        // Get available variants grouped by color
                        const variantsByColor = new Map<string, ProductVariant[]>()
                        const variantsBySize = new Map<string, ProductVariant[]>()
                        const selectedColor = selectedVariants[product.id]
                        
                        product.variants.forEach((variant: ProductVariant) => {
                          // Show all active variants to customers
                          if (!variant.isActive) return
                          
                          try {
                            let attrs: Record<string, string> = {}
                            if (variant.attributes) {
                              attrs = typeof variant.attributes === 'string' 
                                ? JSON.parse(variant.attributes) 
                                : variant.attributes
                            }
                            
                            const colorValue = attrs[colorAttrName] || variant.color || ""
                            if (colorValue) {
                              if (!variantsByColor.has(colorValue)) {
                                variantsByColor.set(colorValue, [])
                              }
                              variantsByColor.get(colorValue)!.push(variant)
                            }
                            
                            if (sizeAttrName && attrs[sizeAttrName]) {
                              const sizeValue = attrs[sizeAttrName]
                              if (!variantsBySize.has(sizeValue)) {
                                variantsBySize.set(sizeValue, [])
                              }
                              variantsBySize.get(sizeValue)!.push(variant)
                            }
                          } catch {}
                        })
                        
                        // Get sizes for selected color
                        const getSizesForColor = (color: string): string[] => {
                          const colorVariants = variantsByColor.get(color) || []
                          const sizes = new Set<string>()
                          colorVariants.forEach(variant => {
                            try {
                              let attrs: Record<string, string> = {}
                              if (variant.attributes) {
                                attrs = typeof variant.attributes === 'string' 
                                  ? JSON.parse(variant.attributes) 
                                  : variant.attributes
                              }
                              if (sizeAttrName && attrs[sizeAttrName]) {
                                sizes.add(attrs[sizeAttrName])
                              }
                            } catch {}
                          })
                          return Array.from(sizes).sort()
                        }
                        
                        const selectedColorName = selectedColor ? (() => {
                          try {
                            let attrs: Record<string, string> = {}
                            if (selectedColor.attributes) {
                              attrs = typeof selectedColor.attributes === 'string' 
                                ? JSON.parse(selectedColor.attributes) 
                                : selectedColor.attributes
                            }
                            return attrs[colorAttrName] || selectedColor.color || ""
                          } catch {
                            return selectedColor.color || ""
                          }
                        })() : ""
                        
                        const availableSizesForSelectedColor = selectedColorName ? getSizesForColor(selectedColorName) : []
                        const selectedSizeValue = selectedSizes[product.id] || ""
                        
                        // Find variant matching selected color and size
                        const getVariantForColorAndSize = (color: string, size: string | null): ProductVariant | null => {
                          const colorVariants = variantsByColor.get(color) || []
                          if (!size) return colorVariants[0] || null
                          
                          return colorVariants.find(variant => {
                            try {
                              let attrs: Record<string, string> = {}
                              if (variant.attributes) {
                                attrs = typeof variant.attributes === 'string' 
                                  ? JSON.parse(variant.attributes) 
                                  : variant.attributes
                              }
                              return attrs[sizeAttrName || ""] === size
                            } catch {
                              return false
                            }
                          }) || null
                        }
                        
                        return (
                          <div className="pt-3 border-t border-gray-200 space-y-3" onClick={(e) => e.stopPropagation()}>
                            {/* Color Variants - Dashboard Style */}
                            <div>
                              <p className="text-xs text-gray-500 font-gill-sans mb-2">Color:</p>
                              <div className="flex flex-wrap gap-2">
                                {Array.from(variantsByColor.keys()).map((color, idx) => {
                                  const colorVariants = variantsByColor.get(color) || []
                                  const firstVariant = colorVariants[0]
                                  const colorHex = firstVariant?.colorHex || "#cccccc"
                                  const finalColor = colorHex && colorHex.trim() !== "" 
                                    ? (colorHex.startsWith("#") ? colorHex : `#${colorHex}`)
                                    : "#cccccc"
                                  
                                  // Get variant images
                                  let variantImageUrls: string[] = []
                                  try {
                                    if (firstVariant?.mediaUrls) {
                                      const parsed = typeof firstVariant.mediaUrls === 'string' 
                                        ? JSON.parse(firstVariant.mediaUrls) 
                                        : firstVariant.mediaUrls
                                      variantImageUrls = Array.isArray(parsed) ? parsed : []
                                    }
                                    if (variantImageUrls.length === 0 && firstVariant?.imageUrl) {
                                      variantImageUrls = [firstVariant.imageUrl]
                                    }
                                  } catch {}
                                  
                                  const isSelected = selectedColorName === color
                                  // Check if all variants of this color are out of stock
                                  const allOutOfStock = colorVariants.every(v => v.isAvailable === false)
                                  const isOutOfStock = allOutOfStock || firstVariant?.isAvailable === false
                                  
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        // Auto-select first size if available
                                        const sizesForColor = getSizesForColor(color)
                                        const sizeToUse = selectedSizeValue && sizesForColor.includes(selectedSizeValue) 
                                          ? selectedSizeValue 
                                          : (sizesForColor.length > 0 ? sizesForColor[0] : null)
                                        
                                        if (sizeToUse) {
                                          setSelectedSizes({
                                            ...selectedSizes,
                                            [product.id]: sizeToUse
                                          })
                                        }
                                        
                                        const variant = getVariantForColorAndSize(color, sizeToUse)
                                        if (variant) {
                                          setSelectedVariants({
                                            ...selectedVariants,
                                            [product.id]: variant
                                          })
                                          // Find image index for this variant in allImages
                                          let imgIdx = 0
                                          try {
                                            let variantImgs: string[] = []
                                            if (variant.mediaUrls) {
                                              const parsed = typeof variant.mediaUrls === 'string' 
                                                ? JSON.parse(variant.mediaUrls) 
                                                : variant.mediaUrls
                                              variantImgs = Array.isArray(parsed) ? parsed : []
                                            }
                                            if (variantImgs.length === 0 && variant.imageUrl) {
                                              variantImgs = [variant.imageUrl]
                                            }
                                            if (variantImgs.length > 0) {
                                              imgIdx = allImages.findIndex(img => variantImgs.includes(img))
                                            }
                                          } catch {}
                                          if (imgIdx < 0) imgIdx = 0
                                          setProductImageIndex({
                                            ...productImageIndex,
                                            [product.id]: imgIdx
                                          })
                                        }
                                      }}
                                      className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                                        isSelected 
                                          ? "border-[#ed6b3e] scale-110" 
                                          : "border-gray-300 hover:scale-110 hover:border-gray-400"
                                      } ${isOutOfStock ? "opacity-60" : ""}`}
                                      style={{ backgroundColor: finalColor }}
                                      title={`${color}${isOutOfStock ? " (Out of Stock)" : ""} - Click to view images`}
                                    >
                                      {variantImageUrls.length > 0 && (
                                        <div className={`absolute -top-1 -right-1 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center ${
                                          isOutOfStock ? "bg-red-500" : "bg-blue-500"
                                        }`}>
                                          {variantImageUrls.length}
                                        </div>
                                      )}
                                      {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-6 h-0.5 bg-red-500 rotate-45"></div>
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            
                            {/* Size Variants - Dashboard Style */}
                            {sizeAttrName && availableSizesForSelectedColor.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 font-gill-sans mb-2">Size:</p>
                                <div className="flex flex-wrap gap-2">
                                  {availableSizesForSelectedColor.map((size, idx) => {
                                    const isSelected = selectedSizeValue === size
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          const variant = getVariantForColorAndSize(selectedColorName, size)
                                          if (variant) {
                                            setSelectedVariants({
                                              ...selectedVariants,
                                              [product.id]: variant
                                            })
                                            setSelectedSizes({
                                              ...selectedSizes,
                                              [product.id]: size
                                            })
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-gill-sans transition-all ${
                                          isSelected
                                            ? "bg-gray-800 text-white border border-gray-800"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                        }`}
                                      >
                                        {size}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Add to Cart Button */}
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const variant = selectedVariants[product.id]
                                if (!variant) {
                                  alert("Please select a color" + (sizeAttrName ? " and size" : ""))
                                  return
                                }
                                // Check if variant is available before adding to cart
                                if (variant.isAvailable === false) {
                                  alert("This variant is currently out of stock. Please select another option.")
                                  return
                                }
                                addToCart(product, variant)
                              }}
                              className={`w-full font-gill-sans font-semibold py-2 rounded-full ${
                                selectedVariants[product.id]?.isAvailable === false
                                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                  : "bg-[#ed6b3e] hover:bg-[#d55a2e] text-white"
                              }`}
                              disabled={!selectedVariants[product.id] || selectedVariants[product.id]?.isAvailable === false}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {selectedVariants[product.id]?.isAvailable === false ? "Out of Stock" : "Add to Cart"}
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
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
