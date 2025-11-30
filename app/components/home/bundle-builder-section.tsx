"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, Eye } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  discount?: number
  images: string[]
  colors: {
    name: string
    value: string
    images: string[]
  }[]
  selectedColor: string
}

interface BundleItem {
  productId: string
  colorName: string
  price: number
  name: string
  image: string
}

const products: Product[] = [
  {
    id: "zenith-tray",
    name: "Zenith Stackable Tray",
    category: "Accessories",
    price: 3953.0,
    images: [
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
    ],
    selectedColor: "White",
    colors: [
      {
        name: "White",
        value: "#f6f6f6",
        images: [
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
        ],
      },
      {
        name: "Brown",
        value: "#927a6d",
        images: [
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
        ],
      },
      {
        name: "Blue",
        value: "#9ab0c7",
        images: [
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
      "/assets/images/bundler1.webp",
        ],
      },
    ],
  },
  {
    id: "waste-bin",
    name: "Streamline Waste Bin",
    category: "Accessories",
    price: 3752.0,
    originalPrice: 5002.67,
    discount: 25,
    images: [
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
    ],
    selectedColor: "Green",
    colors: [
      {
        name: "Green",
        value: "#90c695",
        images: [
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
        ],
      },
      {
        name: "Brown",
        value: "#927a6d",
        images: [
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
      "/assets/images/bundler2.webp",
        ],
      },
    ],
  },
  {
    id: "ambient-light",
    name: "Glide Ambient Light",
    category: "Lighting",
    price: 12257.0,
    images: [
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
    ],
    selectedColor: "Beige",
    colors: [
      {
        name: "Beige",
        value: "#d4a574",
        images: [
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
        ],
      },
      {
        name: "Black",
        value: "#2c2c2c",
        images: [
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
        ],
      },
      {
        name: "Blue",
        value: "#9ab0c7",
        images: [
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
        ],
      },
      {
        name: "Brown",
        value: "#927a6d",
        images: [
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
      "/assets/images/bundler3.webp",
        ],
      },
    ],
  },
  {
    id: "modern-chair",
    name: "Modern Accent Chair",
    category: "Seating",
    price: 4250.0,
    originalPrice: 5000.0,
    discount: 15,
    images: [
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
    ],
    selectedColor: "Orange",
    colors: [
      {
        name: "Orange",
        value: "#ed6b3e",
        images: [
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
        ],
      },
      {
        name: "Navy",
        value: "#18395c",
        images: [
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
        ],
      },
      {
        name: "Gray",
        value: "#6c757d",
        images: [
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
      "/assets/images/bundler4.webp",
        ],
      },
    ],
  },
  {
    id: "coffee-table",
    name: "Minimalist Coffee Table",
    category: "Tables",
    price: 1890.0,
    images: [
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
    ],
    selectedColor: "Navy",
    colors: [
      {
        name: "Navy",
        value: "#18395c",
        images: [
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
        ],
      },
      {
        name: "Orange",
        value: "#ed6b3e",
        images: [
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
      "/assets/images/bundler5.webp",
        ],
      },
    ],
  },
  {
    id: "floor-lamp",
    name: "Scandinavian Floor Lamp",
    category: "Lighting",
    price: 3150.0,
    originalPrice: 3500.0,
    discount: 10,
    images: [
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
    ],
    selectedColor: "Orange",
    colors: [
      {
        name: "Orange",
        value: "#ed6b3e",
        images: [
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
        ],
      },
      {
        name: "Navy",
        value: "#18395c",
        images: [
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
      "/assets/images/bundler6.webp",
        ],
      },
    ],
  },
]

export default function BundleBuilderSection() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(products)
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({})

  const handleColorChange = (productId: string, colorName: string) => {
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.id === productId) {
          const selectedColorData = product.colors.find((c) => c.name === colorName)
          return {
            ...product,
            selectedColor: colorName,
            images:  product.images,
          }
        }
        return product
      }),
    )
    // Reset image index when color changes
    setCurrentImageIndex((prev) => ({ ...prev, [productId]: 0 }))
  }

  const addToBundle = (productId: string) => {
    const product = selectedProducts.find((p) => p.id === productId)
    if (!product) return

    const selectedColorData = product.colors.find((c) => c.name === product.selectedColor)
    if (!selectedColorData) return

    const bundleItem: BundleItem = {
      productId: product.id,
      colorName: product.selectedColor,
      price: product.price,
      name: product.name,
      image: selectedColorData.images[0],
    }

    setBundleItems((prev) => [...prev, bundleItem])
  }

  const removeFromBundle = (index: number) => {
    setBundleItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImageHover = (productId: string, imageIndex: number) => {
    setCurrentImageIndex((prev) => ({ ...prev, [productId]: imageIndex }))
  }

  const totalPrice = bundleItems.reduce((sum, item) => sum + item.price, 0)
  const savings = bundleItems.length >= 3 ? totalPrice * 0.3 : 0
  const finalPrice = totalPrice - savings

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden px-40 rounded-t-4xl">
        <div className="absolute inset-0 ">
          <Image src="/assets/images/hero2.jpg" alt="Decorative vases and plants" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-6">
              CREATE YOUR BUNDLE
            </h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed">
              The choice is yours. With our bundle builder, you can select any combination from our range of products.
              The easiest way to keep everyone happy.
            </p>
          </div>
        </div>
      </div>

      {/* Bundle Builder Section */}
      <div className="px-8 lg:px-56 py-16 ">
        <div className=" mx-auto  ">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 ">
            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedProducts.map((product) => {
                  const selectedColorData = product.colors.find((c) => c.name === product.selectedColor)
                  const currentImages = selectedColorData?.images || product.images
                  const displayImageIndex = currentImageIndex[product.id] || 0

                  return (
                    <div
                      key={product.id}
                      className="card product-card product-card--standard flex flex-col leading-none relative bg-transparent rounded-lg   transition-all duration-300"
                      style={{ height: "auto" }}
                      onMouseEnter={() => setHoveredCard(product.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Product Media */}
                      <div className="product-card__media relative h-auto">
                        {/* Quick View Button */}
                        <button
                          type="button"
                          className={`quick-view__button button button--secondary z-10 absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                            hoveredCard === product.id ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="badges z-10 absolute top-4 left-4">
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              Save {product.discount}%
                            </div>
                          </div>
                        )}

                        {/* Product Images */}
                        <div className="block relative media media--portrait aspect-[3/4] overflow-hidden rounded-t-lg rounded-b-lg">
                          <Image
                            src={currentImages[displayImageIndex] || "/placeholder.svg"}
                            alt={`${product.name} - ${product.selectedColor}`}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />

                          {/* Image Navigation Dots */}
                          {currentImages.length > 1 && hoveredCard === product.id && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {currentImages.map((_, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    displayImageIndex === index ? "bg-white" : "bg-white/50"
                                  }`}
                                  onMouseEnter={() => handleImageHover(product.id, index)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="product-card__content grow flex flex-col justify-start text-center py-6">
                        {/* Category, Name, Price in one transparent div */}
                        <div className="bg-transparent mb-4">
                          <span className="caption uppercase leading-none tracking-widest text-xs text-gray-500 font-gill-sans block mb-2">
                            {product.category}
                          </span>
                          <span className="product-card__title text-base font-medium leading-tight text-gray-900 font-gill-sans block mb-2">
                            {product.name}
                          </span>
                          <div className="price flex justify-center gap-2">
                            <span className="price__regular whitespace-nowrap text-lg font-medium text-gray-900">
                              LE{" "}
                              {product.price.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
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

                        {/* Color Selection in bordered div */}
                        <div className="border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="form__label flex items-center justify-center gap-2 w-full mb-3">
                            <div className="flex gap-2 text-sm text-gray-600 font-gill-sans">
                              Color: <span className="font-medium">{product.selectedColor}</span>
                            </div>
                          </div>
                          <div className="swatches swatches--round flex justify-center gap-3">
                            {product.colors.map((color) => (
                              <button
                                key={color.name}
                                type="button"
                                onClick={() => handleColorChange(product.id, color.name)}
                                className={`color-swatch cursor-pointer relative w-8 h-8 rounded-full border-2 transition-all ${
                                  product.selectedColor === color.name
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

                        {/* Add to Bundle Button alone */}
                        <button
                          type="button"
                          onClick={() => addToBundle(product.id)}
                          className="product-form__submit button button--primary w-full py-3 rounded-full text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "#18395c" }}
                        >
                          Add to bundle
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bundle Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-20">
                <h3 className="text-2xl font-oblong font-bold mb-4" style={{ color: "#18395c" }}>
                  YOUR BUNDLE
                </h3>
                <p className="text-sm text-gray-600 mb-6 font-gill-sans">
                  Add at least 3 products to proceed and Save 30%
                </p>

                {/* Bundle Items */}
                <div className="space-y-4 mb-6 min-h-[200px]">
                  {bundleItems.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 font-gill-sans">
                      No items in bundle
                    </div>
                  ) : (
                    bundleItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.colorName}</p>
                          <p className="text-sm font-bold">LE {item.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromBundle(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>LE {totalPrice.toFixed(2)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bundle Savings (30%):</span>
                      <span>-LE {savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>TOTAL:</span>
                    <span>LE {finalPrice.toFixed(2)} EGP</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  disabled={bundleItems.length === 0}
                  className="w-full mt-6 py-3 rounded-full font-gill-sans font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#ed6b3e" }}
                >
                  ADD TO CART
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
