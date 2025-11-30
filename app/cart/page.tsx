"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Minus, Plus, X, ShoppingBag } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


interface CartItem {
  id: string
  name: string
  color: string
  price: number
  quantity: number
  image: string
}

const initialCartItems: CartItem[] = [
  {
    id: "flow-chair-brown",
    name: "Flow Side Chair",
    color: "Brown",
    price: 62483.0,
    quantity: 2,
    image: "/placeholder.svg?height=200&width=200&text=Brown+Chair",
  },
  {
    id: "pendant-lamp-black",
    name: "Aura Pendant Lamp",
    color: "Black",
    price: 35875.0,
    quantity: 1,
    image: "/placeholder.svg?height=200&width=200&text=Pendant+Light",
  },
]

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)
  const [promoCode, setPromoCode] = useState("")

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id)
      return
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 10000 ? 0 : 150
  const tax = subtotal * 0.14 // 14% VAT
  const total = subtotal + shipping + tax

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-8 py-16 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-8" />
          <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 font-gill-sans mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/collections">
            <Button className="bg-burnt-orange text-white font-gill-sans font-semibold px-8 py-3 rounded-full hover:bg-burnt-orange/90">
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
        <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-gill-sans font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 font-gill-sans">Color: {item.color}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      LE {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-full">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 rounded-l-full transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 font-gill-sans font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 rounded-r-full transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-xl font-oblong font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Subtotal:</span>
                <span>LE {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Shipping:</span>
                <span>{shipping === 0 ? "Free" : `LE ${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Tax (14%):</span>
                <span>LE {tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>LE {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                />
                <Button variant="outline" className="px-4 py-2 text-sm font-gill-sans bg-transparent">
                  Apply
                </Button>
              </div>
            </div>

            <Link href="/checkout">
              <Button
                className="w-full py-4 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity mb-4"
                style={{ backgroundColor: "#18395c" }}
              >
                Proceed to Checkout
              </Button>
            </Link>

            <Link href="/collections">
              <Button
                variant="outline"
                className="w-full py-4 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-gill-sans font-semibold tracking-wide bg-transparent"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
