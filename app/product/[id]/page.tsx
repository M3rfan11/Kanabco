"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Heart, Share2, Truck, Shield, RotateCcw, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Navigation from "@/app/components/navigation"
import Footer from "@/app/components/footer"
import { useCart } from "@/app/contexts/CartContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface ProductImage {
  id: string
  src: string
  alt: string
}

interface ProductVariant {
  id: number
  color?: string | null
  colorHex?: string | null
  attributes?: string | null // JSON object of variant attributes
  imageUrl?: string | null
  mediaUrls?: string | null // JSON array of image URLs
  priceOverride?: number | null
  sku?: string | null
  isActive: boolean
  quantity?: number
  isOutOfStock?: boolean
  isAvailable?: boolean
}

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  mediaUrls?: string | null // JSON array of product images
  variantAttributes?: string | null // JSON array of attribute names (e.g., ["Color", "Size"])
  categoryName: string
  variants: ProductVariant[]
  sku?: string | null
}

interface ColorOption {
  name: string
  value: string
  images: ProductImage[]
}

interface SizeOption {
  name: string
  variantId: number
  priceOverride?: number | null
  sku?: string | null
}

// Helper function to generate product images from variant or product
const generateProductImages = (product: Product, variant?: ProductVariant): ProductImage[] => {
  const images: ProductImage[] = []
  
  // Get images from variant mediaUrls
  if (variant?.mediaUrls) {
    try {
      const variantImages = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
      if (Array.isArray(variantImages) && variantImages.length > 0) {
        variantImages.forEach((imgUrl: string, index: number) => {
          images.push({
            id: `variant-${index}`,
            src: imgUrl,
            alt: `${product.name} - Image ${index + 1}`,
          })
        })
        return images
      }
    } catch {
      // Fallback to imageUrl
    }
  }
  
  // Fallback to variant imageUrl
  if (variant?.imageUrl) {
    images.push({
      id: "variant-main",
      src: variant.imageUrl,
      alt: `${product.name} - Variant Image`,
    })
    return images
  }
  
  // Get images from product mediaUrls
  if (product.mediaUrls) {
    try {
      const productImages = typeof product.mediaUrls === 'string' ? JSON.parse(product.mediaUrls) : product.mediaUrls
      if (Array.isArray(productImages) && productImages.length > 0) {
        productImages.forEach((imgUrl: string, index: number) => {
          images.push({
            id: `product-${index}`,
            src: imgUrl,
            alt: `${product.name} - Image ${index + 1}`,
          })
        })
        return images
      }
    } catch {
      // Fallback to imageUrl
    }
  }
  
  // Final fallback to product imageUrl
  const baseImage = product.imageUrl || "/placeholder.svg?height=600&width=600"
  return [
    {
      id: "main",
      src: baseImage,
      alt: `${product.name} - Main View`,
    },
  ]
}

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

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToCart: addItemToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([])
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([])
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null)
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "shipping">("description")
  const [attributeNames, setAttributeNames] = useState<string[]>([])
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

  // Helper function to update size options based on selected color
  const updateSizeOptions = (selectedColorName: string, variants: ProductVariant[], attributeNames: string[]) => {
    // Show ALL active variants (not just available ones) - like dashboard
    const activeVariants = variants.filter((v: ProductVariant) => v.isActive)
    
    // Find all attribute names from variants if not provided
    if (attributeNames.length === 0 && activeVariants.length > 0) {
      try {
        const firstVariant = activeVariants[0]
        if (firstVariant.attributes) {
          const attrs = typeof firstVariant.attributes === 'string' 
            ? JSON.parse(firstVariant.attributes) 
            : firstVariant.attributes
          attributeNames = Object.keys(attrs || {})
        }
      } catch {
        attributeNames = ["Color"]
      }
    }
    
    // Check if product has a Size attribute (second attribute or explicitly named "Size")
    const hasSizeAttribute = attributeNames.length > 1 || attributeNames.includes("Size")
    const sizeAttrName = attributeNames.length > 1 ? attributeNames[1] : (attributeNames.includes("Size") ? "Size" : null)
    const colorAttrName = attributeNames[0] || "Color"
    
    const sizes: SizeOption[] = []
    const seenSizes = new Set<string>()
    
    // If there's no size attribute, show "One Size" if there are variants
    if (!hasSizeAttribute && activeVariants.length > 0) {
      // Check if any variant matches the selected color
      const matchingVariants = activeVariants.filter((variant: ProductVariant) => {
        try {
          let attrs: Record<string, string> = {}
          if (variant.attributes) {
            attrs = typeof variant.attributes === 'string' 
              ? JSON.parse(variant.attributes) 
              : variant.attributes
          }
          const variantColor = attrs[colorAttrName] || variant.color || ""
          return variantColor === selectedColorName
        } catch {
          return variant.color === selectedColorName
        }
      })
      
      if (matchingVariants.length > 0) {
        // Use the first matching variant for "One Size"
        sizes.push({
          name: "One Size",
          variantId: matchingVariants[0].id,
          priceOverride: matchingVariants[0].priceOverride || undefined,
          sku: matchingVariants[0].sku || undefined,
        })
      }
    } else {
      // Product has size attribute - show all sizes for selected color
      activeVariants.forEach((variant: ProductVariant) => {
        try {
          let attrs: Record<string, string> = {}
          if (variant.attributes) {
            attrs = typeof variant.attributes === 'string' 
              ? JSON.parse(variant.attributes) 
              : variant.attributes
          }
          
          const variantColor = attrs[colorAttrName] || variant.color || ""
          
          // Include variants that match the selected color (show all, not just available)
          if (variantColor === selectedColorName) {
            let sizeValue: string
            if (sizeAttrName && attrs[sizeAttrName]) {
              sizeValue = attrs[sizeAttrName]
            } else if (hasSizeAttribute) {
              // Has size attribute but this variant doesn't have it set
              sizeValue = "Default"
            } else {
              // Fallback - try to get size from variant name or SKU
              sizeValue = variant.sku || `Variant ${variant.id}`
            }
            
            if (!seenSizes.has(sizeValue)) {
              seenSizes.add(sizeValue)
              sizes.push({
                name: sizeValue,
                variantId: variant.id,
                priceOverride: variant.priceOverride || undefined,
                sku: variant.sku || undefined,
              })
            }
          }
        } catch (error) {
          console.error("Error processing variant in updateSizeOptions:", error, variant)
          // Skip invalid variants
        }
      })
      
      // If no sizes found but we have variants for this color, check if we should show "One Size"
      if (sizes.length === 0) {
        const matchingVariants = activeVariants.filter((variant: ProductVariant) => {
          try {
            let attrs: Record<string, string> = {}
            if (variant.attributes) {
              attrs = typeof variant.attributes === 'string' 
                ? JSON.parse(variant.attributes) 
                : variant.attributes
            }
            const variantColor = attrs[colorAttrName] || variant.color || ""
            return variantColor === selectedColorName
          } catch {
            return variant.color === selectedColorName
          }
        })
        
        if (matchingVariants.length > 0) {
          sizes.push({
            name: "One Size",
            variantId: matchingVariants[0].id,
            priceOverride: matchingVariants[0].priceOverride || undefined,
            sku: matchingVariants[0].sku || undefined,
          })
        }
      }
    }
    
    // Sort sizes if they're numeric or standard sizes
    sizes.sort((a, b) => {
      const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
      const aIndex = sizeOrder.indexOf(a.name.toUpperCase())
      const bIndex = sizeOrder.indexOf(b.name.toUpperCase())
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.name.localeCompare(b.name)
    })
    
    console.log("updateSizeOptions - selectedColorName:", selectedColorName)
    console.log("updateSizeOptions - attributeNames:", attributeNames)
    console.log("updateSizeOptions - activeVariants count:", activeVariants.length)
    console.log("updateSizeOptions - sizes found:", sizes)
    
    setSizeOptions(sizes)
    if (sizes.length > 0) {
      setSelectedSize(sizes[0])
    } else {
      setSelectedSize(null)
    }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Product/${id}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Product data:", data)
          console.log("Variants:", data.variants)
          console.log("VariantAttributes:", data.variantAttributes)
          setProduct(data)
          
          // Show ALL active variants (not just available ones) - show all combinations
          const activeVariants = data.variants?.filter((v: ProductVariant) => 
            v.isActive
          ) || []
          
          if (activeVariants.length > 0) {
            // Try to parse variantAttributes to determine attribute structure
            let attributeNames: string[] = []
            try {
              if (data.variantAttributes) {
                attributeNames = typeof data.variantAttributes === 'string' 
                  ? JSON.parse(data.variantAttributes) 
                  : data.variantAttributes
              }
            } catch {}
            
            // If still empty, try to infer from ALL variants (not just first)
            if (attributeNames.length === 0 && activeVariants.length > 0) {
              const allAttrKeys = new Set<string>()
              activeVariants.forEach((variant: ProductVariant) => {
                try {
                  if (variant.attributes) {
                    const attrs = typeof variant.attributes === 'string'
                      ? JSON.parse(variant.attributes)
                      : variant.attributes
                    if (attrs && typeof attrs === 'object') {
                      Object.keys(attrs).forEach(key => allAttrKeys.add(key))
                    }
                  }
                } catch {}
              })
              attributeNames = Array.from(allAttrKeys)
            }
            
            // Final fallback
            if (attributeNames.length === 0) {
              attributeNames = ["Color"]
            }
            
            // Store attribute names in state for use in component
            setAttributeNames(attributeNames)
            console.log("Final attributeNames detected:", attributeNames)
            
            // Extract unique colors (first attribute, typically "Color")
            const colorAttrName = attributeNames[0] || "Color"
            const colorMap = new Map<string, { images: string[], colorHex?: string }>()
            
            // Show ALL active variants to customers (not just available ones) - show all combinations
            activeVariants.forEach((variant: ProductVariant) => {
              try {
                // Include all active variants, regardless of availability - show all color/size combinations
                
                let attrs: Record<string, string> = {}
                if (variant.attributes) {
                  attrs = typeof variant.attributes === 'string' 
                    ? JSON.parse(variant.attributes) 
                    : variant.attributes
                } else if (variant.color) {
                  // Legacy: use color field
                  attrs = { [colorAttrName]: variant.color }
                }
                
                const colorValue = attrs[colorAttrName] || variant.color || "Default"
                
                // Get images for this color
                let variantImages: string[] = []
                if (variant.mediaUrls) {
                  try {
                    const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
                    variantImages = Array.isArray(parsed) ? parsed : []
                  } catch {
                    if (variant.imageUrl) variantImages = [variant.imageUrl]
                  }
                } else if (variant.imageUrl) {
                  variantImages = [variant.imageUrl]
                }
                
                if (!colorMap.has(colorValue)) {
                  colorMap.set(colorValue, { images: variantImages, colorHex: variant.colorHex || undefined })
                } else {
                  // Merge images (deduplicate)
                  const existing = colorMap.get(colorValue)!
                  variantImages.forEach(img => {
                    if (!existing.images.includes(img)) {
                      existing.images.push(img)
                    }
                  })
                }
              } catch {
                // Skip invalid variants
              }
            })
            
            // Create color options
            const colors: ColorOption[] = Array.from(colorMap.entries()).map(([colorName, colorData]) => ({
              name: colorName,
              value: colorData.colorHex || "#cccccc",
              images: colorData.images.map((imgUrl, idx) => ({
                id: `color-${colorName}-${idx}`,
                src: imgUrl,
                alt: `${data.name} - ${colorName} - Image ${idx + 1}`,
              })),
            }))
            
            setColorOptions(colors)
            console.log("Color options:", colors)
            console.log("Attribute names:", attributeNames)
            console.log("Active variants:", activeVariants)
            console.log("All variants:", data.variants)
            if (colors.length > 0) {
              setSelectedColor(colors[0])
              updateSizeOptions(colors[0].name, activeVariants, attributeNames)
            }
          } else {
            // If no variants, create a default option
            const defaultImages = generateProductImages(data)
            const defaultOption: ColorOption = {
              name: "Default",
              value: "#cccccc",
              images: defaultImages,
            }
            setColorOptions([defaultOption])
            setSelectedColor(defaultOption)
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Check if product is in wishlist when product and variant are selected
  useEffect(() => {
    const checkWishlist = async () => {
      if (!product) return
      
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        setIsInWishlist(false)
        return
      }

      try {
        const variantId = selectedSize?.variantId || null
        const res = await fetch(`${API_BASE_URL}/api/Wishlist/check?productId=${product.id}&productVariantId=${variantId || ""}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (res.ok) {
          const data = await res.json()
          setIsInWishlist(data.isInWishlist)
        }
      } catch (error) {
        console.error("Error checking wishlist:", error)
      }
    }

    checkWishlist()
  }, [product, selectedSize])

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }

  const handleColorChange = (color: ColorOption) => {
    setSelectedColor(color)
    setSelectedImageIndex(0)
    setSelectedSize(null) // Reset size when color changes
    
    // Update size options for the selected color
    if (!product) return
    
    // Use ALL active variants (not just available ones) - show all combinations
    const activeVariants = product.variants?.filter((v: ProductVariant) => 
      v.isActive
    ) || []
    
    // Use the attributeNames from state (already detected)
    // If not available, try to detect from product
    let detectedAttributeNames = attributeNames
    if (detectedAttributeNames.length === 0) {
      try {
        if (product.variantAttributes) {
          detectedAttributeNames = typeof product.variantAttributes === 'string' 
            ? JSON.parse(product.variantAttributes) 
            : product.variantAttributes
        }
      } catch {}
      
      // If still empty, infer from variants
      if (detectedAttributeNames.length === 0 && activeVariants.length > 0) {
        const allAttrKeys = new Set<string>()
        activeVariants.forEach((variant: ProductVariant) => {
          try {
            if (variant.attributes) {
              const attrs = typeof variant.attributes === 'string'
                ? JSON.parse(variant.attributes)
                : variant.attributes
              if (attrs && typeof attrs === 'object') {
                Object.keys(attrs).forEach(key => allAttrKeys.add(key))
              }
            }
          } catch {}
        })
        detectedAttributeNames = Array.from(allAttrKeys)
      }
      
      // Final fallback
      if (detectedAttributeNames.length === 0) {
        detectedAttributeNames = ["Color"]
      }
    }
    
    console.log("handleColorChange - color:", color.name)
    console.log("handleColorChange - activeVariants:", activeVariants.length)
    console.log("handleColorChange - attributeNames:", detectedAttributeNames)
    
    updateSizeOptions(color.name, activeVariants, detectedAttributeNames)
  }

  const addToCart = () => {
    if (!product || !selectedColor) {
      alert("Please select a color")
      return
    }
    
    // Get the selected variant
    const variantId = selectedSize?.variantId || null
    const variant = product.variants?.find((v: ProductVariant) => v.id === variantId)
    
    // Check if variant is available
    if (variant && variant.isAvailable === false) {
      alert("This variant is currently out of stock. Please select another option.")
      return
    }
    
    // Get price
    const price = selectedSize?.priceOverride || variant?.priceOverride || product.price
    
    // Get product image
    const productImage = selectedColor.images[0]?.src || product.imageUrl || "/placeholder.svg"
    
    // Add to cart
    addItemToCart({
      productId: product.id,
      variantId: variantId,
      name: product.name,
      color: selectedColor.name,
      size: selectedSize?.name || null,
      price: price,
      quantity: quantity,
      image: productImage,
      sku: variant?.sku || product.sku || null,
    })
    
    alert(`Added ${product.name} (${selectedColor.name}${selectedSize ? `, ${selectedSize.name}` : ""}) to cart!`)
  }

  const toggleWishlist = async () => {
    const token = sessionStorage.getItem("authToken")
    if (!token) {
      alert("Please log in to add items to your wishlist")
      router.push(`/login?redirect=${encodeURIComponent(`/product/${id}`)}`)
      return
    }

    setIsTogglingWishlist(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist - we need to find the wishlist item ID first
        const res = await fetch(`${API_BASE_URL}/api/Wishlist`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (res.ok) {
          const wishlistItems = await res.json()
          const item = wishlistItems.find((item: any) => 
            product && item.productId === product.id && 
            item.productVariantId === (selectedSize?.variantId || null)
          )

          if (item) {
            const deleteRes = await fetch(`${API_BASE_URL}/api/Wishlist/${item.id}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (deleteRes.ok) {
              setIsInWishlist(false)
            }
          }
        }
      } else {
        // Add to wishlist
        const res = await fetch(`${API_BASE_URL}/api/Wishlist`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            productVariantId: selectedSize?.variantId || null,
          }),
        })

        if (res.ok) {
          setIsInWishlist(true)
          alert("Added to wishlist!")
        } else if (res.status === 409) {
          // Already in wishlist
          setIsInWishlist(true)
          alert("Item is already in your wishlist")
        } else {
          const errorData = await res.json().catch(() => ({ message: "Failed to add to wishlist" }))
          alert(errorData.message || "Failed to add to wishlist")
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product || !selectedColor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Product not found</p>
        </div>
      </div>
    )
  }

  const displayPrice = selectedSize?.priceOverride || product.price

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Breadcrumb */}
      {product && (
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
              <Link href={`/collections?category=${product.categoryName}`} className="hover:text-burnt-orange">
                {product.categoryName}
              </Link>
              <span>/</span>
              <span className="text-gray-900">{product.name}</span>
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm relative">
              <Image
                src={selectedColor.images[selectedImageIndex]?.src || product.imageUrl || "/placeholder.svg"}
                alt={selectedColor.images[selectedImageIndex]?.alt || `${product.name} - ${selectedColor.name}`}
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
              <p className="text-sm text-gray-500 font-gill-sans tracking-wide mb-2">{product.categoryName}</p>
              <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">{product.name.toUpperCase()}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600 font-gill-sans">(24 reviews)</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                LE {displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Product Description */}
            <p className="text-gray-600 font-gill-sans leading-relaxed">
              {product.description || "No description available."}
            </p>

            {/* Color Selection - Dashboard Style with Color Names */}
            {colorOptions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-gill-sans mb-2">Color:</p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    // Find all variants for this color
                    const colorVariants = product.variants?.filter((v: ProductVariant) => {
                      try {
                        let attrs: Record<string, string> = {}
                        if (v.attributes) {
                          attrs = typeof v.attributes === 'string' 
                            ? JSON.parse(v.attributes) 
                            : v.attributes
                        }
                        const colorAttrName = attributeNames[0] || "Color"
                        return (attrs[colorAttrName] || v.color) === color.name && v.isActive
                      } catch {
                        return v.color === color.name && v.isActive
                      }
                    }) || []
                    
                    const firstVariant = colorVariants[0]
                    const colorHex = firstVariant?.colorHex || color.value || "#cccccc"
                    const finalColor = colorHex && colorHex.trim() !== "" 
                      ? (colorHex.startsWith("#") ? colorHex : `#${colorHex}`)
                      : "#cccccc"
                    
                    // Get total variant images count for this color
                    let totalImageCount = 0
                    colorVariants.forEach((variant: ProductVariant) => {
                      try {
                        if (variant.mediaUrls) {
                          const parsed = typeof variant.mediaUrls === 'string' 
                            ? JSON.parse(variant.mediaUrls) 
                            : variant.mediaUrls
                          if (Array.isArray(parsed)) {
                            totalImageCount += parsed.length
                          }
                        }
                        if (totalImageCount === 0 && variant.imageUrl) {
                          totalImageCount = 1
                        }
                      } catch {
                        if (variant.imageUrl) totalImageCount = 1
                      }
                    })
                    
                    const isSelected = selectedColor.name === color.name
                    // Check if all variants of this color are out of stock
                    const allOutOfStock = colorVariants.length > 0 && colorVariants.every(v => v.isAvailable === false)
                    const isOutOfStock = allOutOfStock
                    
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorChange(color)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full border-2 transition-all relative ${
                          isSelected 
                            ? "border-[#ed6b3e] bg-orange-50 scale-105" 
                            : "border-gray-300 hover:scale-105 hover:border-gray-400 bg-white"
                        } ${isOutOfStock ? "opacity-60" : ""}`}
                        title={`${color.name}${isOutOfStock ? " (Out of Stock)" : ""} - Click to view images`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: finalColor }}
                        />
                        <span className="text-xs text-gray-700 font-gill-sans whitespace-nowrap">{color.name}</span>
                        {totalImageCount > 0 && (
                          <div className={`absolute -top-1 -right-1 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center ${
                            isOutOfStock ? "bg-red-500" : "bg-blue-500"
                          }`}>
                            {totalImageCount}
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-0.5 bg-red-500 rotate-45"></div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selection - Dashboard Style */}
            {selectedColor && sizeOptions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-gill-sans mb-2">Size:</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    // Find variant to check availability
                    const variant = product.variants?.find((v: ProductVariant) => v.id === size.variantId)
                    const isOutOfStock = variant?.isAvailable === false
                    const isSelected = selectedSize?.variantId === size.variantId
                    
                    return (
                      <button
                        key={size.variantId || size.name}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 rounded text-xs font-gill-sans transition-all ${
                          isSelected
                            ? "bg-gray-800 text-white border border-gray-800"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        } ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? `${size.name} - Out of Stock` : size.name}
                      >
                        {size.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Wishlist Button */}
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={toggleWishlist}
                disabled={isTogglingWishlist}
                className={`w-full font-gill-sans font-semibold py-2 rounded-full border-2 ${
                  isInWishlist
                    ? "border-[#ed6b3e] bg-[#ed6b3e] text-white hover:bg-[#d55a2e]"
                    : "border-gray-300 hover:border-[#ed6b3e] hover:text-[#ed6b3e]"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? "fill-current" : ""}`} />
                {isTogglingWishlist 
                  ? "Updating..." 
                  : isInWishlist 
                    ? "Remove from Wishlist" 
                    : "Add to Wishlist"}
              </Button>
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
