"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CreditCard, Truck } from "lucide-react"
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

const cartItems: CartItem[] = [
  {
    id: "flow-chair-brown",
    name: "Flow Side Chair",
    color: "Brown",
    price: 62483.0,
    quantity: 2,
    image: "/placeholder.svg?height=100&width=100&text=Brown+Chair",
  },
  {
    id: "pendant-lamp-black",
    name: "Aura Pendant Lamp",
    color: "Black",
    price: 35875.0,
    quantity: 1,
    image: "/placeholder.svg?height=100&width=100&text=Pendant+Light",
  },
]

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "same-day">("standard")

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = shippingMethod === "standard" ? 0 : shippingMethod === "express" ? 300 : 500
  const tax = subtotal * 0.14
  const total = subtotal + shippingCost + tax

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle checkout logic here
    window.location.href = "/order-confirmation"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Back to Cart */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-gill-sans mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First name"
                      required
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      required
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      required
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                    <select
                      required
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    >
                      <option value="">Governorate</option>
                      <option value="cairo">Cairo</option>
                      <option value="giza">Giza</option>
                      <option value="alexandria">Alexandria</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Postal code"
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Shipping Method</h2>
                <div className="space-y-3">
                  {[
                    { id: "standard", name: "Standard Delivery", time: "3-5 business days", price: 0 },
                    { id: "express", name: "Express Delivery", time: "1-2 business days", price: 300 },
                    { id: "same-day", name: "Same Day Delivery", time: "Same day", price: 500 },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        shippingMethod === method.id ? "border-burnt-orange bg-orange-50" : "border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={method.id}
                          checked={shippingMethod === method.id}
                          onChange={(e) => setShippingMethod(e.target.value as typeof shippingMethod)}
                          className="text-burnt-orange"
                        />
                        <div>
                          <div className="font-gill-sans font-medium">{method.name}</div>
                          <div className="text-sm text-gray-600 font-gill-sans">{method.time}</div>
                        </div>
                      </div>
                      <div className="font-gill-sans font-medium">
                        {method.price === 0 ? "Free" : `LE ${method.price}`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3 mb-4">
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "card" ? "border-burnt-orange bg-orange-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="text-burnt-orange"
                    />
                    <CreditCard className="w-5 h-5" />
                    <span className="font-gill-sans font-medium">Credit/Debit Card</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "cash" ? "border-burnt-orange bg-orange-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="text-burnt-orange"
                    />
                    <Truck className="w-5 h-5" />
                    <span className="font-gill-sans font-medium">Cash on Delivery</span>
                  </label>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Card number"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        required
                        className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        required
                        className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Cardholder name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-4 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#18395c" }}
              >
                Complete Order
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-xl font-oblong font-bold text-gray-900 mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-gill-sans font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600 font-gill-sans">{item.color}</p>
                  </div>
                  <div className="text-sm font-bold">
                    LE {(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6 border-t pt-4">
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Subtotal:</span>
                <span>LE {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Shipping:</span>
                <span>{shippingCost === 0 ? "Free" : `LE ${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Tax (14%):</span>
                <span>LE {tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>LE {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
