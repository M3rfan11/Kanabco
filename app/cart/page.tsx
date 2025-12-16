"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { useCart } from "../contexts/CartContext"

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartItemCount } = useCart()
  const [loading, setLoading] = useState(false)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= 10000 ? 0 : 150 // Free shipping over LE 10,000
  const total = subtotal + shippingCost

  const handleQuantityChange = (productId: number, variantId: number | null, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId, variantId || 0)
    } else {
      updateQuantity(productId, variantId || 0, newQuantity)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-8 py-16 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 font-gill-sans mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/collections">
            <Button className="bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold px-8 py-3 rounded-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600 font-gill-sans">
            {getCartItemCount()} {getCartItemCount() === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 0}`}
                className="bg-white rounded-lg shadow-sm p-6 flex gap-6"
              >
                {/* Product Image */}
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-oblong font-bold text-gray-900 mb-1">{item.name}</h3>
                      <div className="text-sm text-gray-600 font-gill-sans space-y-0.5">
                        <p>Color: {item.color}</p>
                        {item.size && <p>Size: {item.size}</p>}
                        {item.sku && <p>SKU: {item.sku}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.productId, item.variantId || 0)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 font-gill-sans">Quantity:</span>
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-gill-sans">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        LE {(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500 font-gill-sans">
                        LE {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-oblong font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 font-gill-sans">
                  <span>Subtotal</span>
                  <span>LE {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-gill-sans">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      `LE ${shippingCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    )}
                  </span>
                </div>
                {subtotal < 10000 && (
                  <p className="text-xs text-gray-500 font-gill-sans">
                    Add LE {(10000 - subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })} more for free shipping
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>LE {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout" className="block">
                <Button
                  className="w-full bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold py-3 rounded-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              {/* Continue Shopping */}
              <Link href="/collections" className="block mt-4">
                <Button
                  variant="outline"
                  className="w-full font-gill-sans"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}



