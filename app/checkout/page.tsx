"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CreditCard, Truck } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { useCart } from "../contexts/CartContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("cash")
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "same-day">("standard")
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<{ code: string; discountAmount: number } | null>(null)
  const [promoCodeError, setPromoCodeError] = useState("")
  const [validatingPromoCode, setValidatingPromoCode] = useState(false)  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    governorate: "",
    postalCode: "",
  })

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = shippingMethod === "standard" ? 0 : shippingMethod === "express" ? 300 : 500
  const discountAmount = appliedPromoCode?.discountAmount || 0
  const total = Math.max(0, subtotal + shippingCost - discountAmount)

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Please enter a promo code")
      return
    }

    setValidatingPromoCode(true)
    setPromoCodeError("")

    try {
      // Get current user ID if logged in
      const token = sessionStorage.getItem("authToken")
      let userId: number | null = null

      if (token) {
        try {
          // Decode JWT to get user ID (simple base64 decode)
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = parseInt(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]) || null
        } catch {
          // If token is invalid, continue without user ID
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/PromoCode/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          userId: userId,
          orderAmount: subtotal,
          productIds: cartItems.map(item => item.productId)
        }),
      })

      const data = await response.json()

      if (data.valid) {
        setAppliedPromoCode({
          code: promoCode.trim().toUpperCase(),
          discountAmount: data.discountAmount
        })
        setPromoCodeError("")
      } else {
        setPromoCodeError(data.message || "Invalid promo code")
        setAppliedPromoCode(null)
      }
    } catch (error) {
      console.error("Error validating promo code:", error)
      setPromoCodeError("Failed to validate promo code. Please try again.")
      setAppliedPromoCode(null)
    } finally {
      setValidatingPromoCode(false)
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null)
    setPromoCode("")
    setPromoCodeError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cartItems.length === 0) {
      alert("Your cart is empty")
      window.location.href = "/cart"
      return
    }

    if (paymentMethod === "card") {
      alert("Credit/Debit card payments are coming soon. Please select Cash on Delivery to complete your order.")
      return
    }

    setLoading(true)

    try {
      // Prepare order items from cart
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        unit: "piece"
      }))

      const shippingCost = shippingMethod === "standard" ? 0 : shippingMethod === "express" ? 300 : 500

      // Check if user is logged in
      const token = sessionStorage.getItem("authToken")
      const isAuthenticated = !!token

      // Use authenticated endpoint if logged in, otherwise use guest endpoint
      const endpoint = isAuthenticated 
        ? `${API_BASE_URL}/api/CustomerOrder/order`
        : `${API_BASE_URL}/api/CustomerOrder/guest-order`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (isAuthenticated && token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const requestBody = isAuthenticated
        ? {
            customerName: `${formData.firstName} ${formData.lastName}`.trim(),
            customerEmail: formData.email,
            customerPhone: formData.phone,
            customerAddress: `${formData.address}${formData.apartment ? `, ${formData.apartment}` : ""}, ${formData.city}, ${formData.governorate}${formData.postalCode ? ` ${formData.postalCode}` : ""}`.trim(),
            useCartItems: false,
            items: orderItems,
            promoCode: appliedPromoCode?.code || null,
            notes: `Shipping Method: ${shippingMethod}${appliedPromoCode ? ` | Promo Code: ${appliedPromoCode.code}` : ""}`
          }
        : {
            customerName: `${formData.firstName} ${formData.lastName}`.trim(),
            customerEmail: formData.email,
            customerPhone: formData.phone,
            customerAddress: `${formData.address}${formData.apartment ? `, ${formData.apartment}` : ""}, ${formData.city}, ${formData.governorate}${formData.postalCode ? ` ${formData.postalCode}` : ""}`.trim(),
            items: orderItems,
            shippingCost: shippingCost,
            paymentMethod: paymentMethod === "cash" ? "Cash on Delivery" : "Card",
            promoCode: appliedPromoCode?.code || null,
            notes: `Shipping Method: ${shippingMethod}${appliedPromoCode ? ` | Promo Code: ${appliedPromoCode.code}` : ""}`
          }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        const data = await res.json()
        const orderNum = data.orderNumber || (isAuthenticated ? data.orderNumber : data.orderNumber)
        setOrderNumber(orderNum)
        clearCart() // Clear cart after successful order
        // Redirect to order confirmation
        window.location.href = `/order-confirmation?orderNumber=${orderNum}&email=${encodeURIComponent(formData.email)}`
      } else {
        const errorText = await res.text()
        let errorMessage = "Failed to create order"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.title || errorMessage
          // If there are validation errors, show them
          if (errorData.errors) {
            const validationErrors = Object.entries(errorData.errors)
              .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
              .join("\n")
            errorMessage = `Validation errors:\n${validationErrors}`
          }
        } catch {
          errorMessage = errorText || errorMessage
        }
        console.error("Order creation error:", errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("An error occurred while creating your order. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-8 py-16 text-center">
          <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 font-gill-sans mb-8">Please add items to your cart before checkout.</p>
          <Link href="/cart">
            <Button className="bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold px-8 py-3 rounded-full">
              Go to Cart
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    />
                    <select
                      required
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                    >
                      <option value="">Governorate</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Giza">Giza</option>
                      <option value="Alexandria">Alexandria</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Postal code"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
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
                    className={`flex items-center justify-between gap-3 p-4 border rounded-lg transition-colors ${
                      paymentMethod === "card" ? "border-gray-300 bg-gray-50" : "border-gray-300"
                    } opacity-60 cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={false}
                        onChange={() => {}}
                        className="text-burnt-orange"
                        disabled
                      />
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="font-gill-sans font-medium text-gray-500">Credit/Debit Card</span>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-gill-sans font-medium">
                      Coming Soon
                    </span>
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
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-gill-sans">
                      Credit/Debit card payments are coming soon. Please select Cash on Delivery to complete your order.
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#18395c" }}
              >
                {loading ? "Processing Order..." : "Complete Order"}
              </Button>
              
              <p className="text-xs text-gray-500 text-center font-gill-sans mt-4">
                By placing your order, you agree to our Terms of Service. You can track your order by logging in with your email.
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-xl font-oblong font-bold text-gray-900 mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <div key={`cart-item-${item.productId}-${item.variantId ?? 'base'}-${index}`} className="flex items-center gap-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-gill-sans font-medium text-sm">{item.name}</h3>
                    <div className="text-xs text-gray-600 font-gill-sans space-y-0.5">
                      <p>Color: {item.color}</p>
                      {item.size && <p>Size: {item.size}</p>}
                    </div>
                  </div>
                  <div className="text-sm font-bold">
                    LE {(item.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="mb-6 border-t pt-4">
              <h3 className="text-sm font-gill-sans font-medium text-gray-900 mb-3">Promo Code</h3>
              {!appliedPromoCode ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase())
                        setPromoCodeError("")
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleApplyPromoCode()
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-[#ed6b3e]"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={validatingPromoCode || !promoCode.trim()}
                      className="px-6 py-2 bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-medium rounded-lg disabled:opacity-50"
                    >
                      {validatingPromoCode ? "..." : "Apply"}
                    </Button>
                  </div>
                  {promoCodeError && (
                    <p className="text-xs text-red-600 font-gill-sans">{promoCodeError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-gill-sans font-medium text-green-800">
                      {appliedPromoCode.code}
                    </span>
                    <span className="text-xs text-green-600 font-gill-sans">
                      -LE {appliedPromoCode.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromoCode}
                    className="text-xs text-green-700 hover:text-green-900 font-gill-sans underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6 border-t pt-4">
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Subtotal:</span>
                <span>LE {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {appliedPromoCode && (
                <div className="flex justify-between text-green-600 font-gill-sans">
                  <span>Discount ({appliedPromoCode.code}):</span>
                  <span>-LE {appliedPromoCode.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 font-gill-sans">
                <span>Shipping:</span>
                <span>{shippingCost === 0 ? "Free" : `LE ${shippingCost.toFixed(2)}`}</span>
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
