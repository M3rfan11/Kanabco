"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Search, Mail, Calendar, MapPin, Phone, CheckCircle2, Clock, Truck, XCircle } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

function TrackOrderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load order number and email from URL parameters if present
  useEffect(() => {
    const urlOrderNumber = searchParams.get("orderNumber")
    const urlEmail = searchParams.get("email")
    
    if (urlOrderNumber) {
      // Remove # prefix if present and normalize
      const normalized = urlOrderNumber.replace(/^#/, "").trim().toUpperCase()
      setOrderNumber(normalized)
    }
    
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }
  }, [searchParams])

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setOrderDetails(null)

    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both order number and email")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/CustomerOrder/track-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim().replace(/^#/, "").toUpperCase(),
          email: email.trim().toLowerCase(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data)
      } else {
        const errorData = await response.json().catch(() => ({ message: "Order not found" }))
        setError(errorData.message || "Order not found. Please check your order number and email.")
      }
    } catch (error) {
      console.error("Error tracking order:", error)
      setError("An error occurred while tracking your order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-600" />
      case "confirmed":
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#18395c] rounded-full mb-6">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-lg text-gray-600 font-gill-sans">
            Enter your order number and email to track your order status
          </p>
        </div>

        {/* Track Order Form */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-6">
            <div>
              <Label htmlFor="orderNumber" className="text-gray-700 font-gill-sans font-medium">
                Order Number
              </Label>
              <Input
                id="orderNumber"
                type="text"
                placeholder="Enter your order number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="mt-2 font-gill-sans"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-gill-sans font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 font-gill-sans"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-gill-sans text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold py-3 rounded-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Tracking...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Track Order
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-oblong font-bold text-gray-900">Order Details</h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(orderDetails.status)}`}>
                {getStatusIcon(orderDetails.status)}
                <span className="font-gill-sans font-semibold capitalize">{orderDetails.status || "Pending"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Order Information */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-gill-sans">Order Number</p>
                    <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-gill-sans">Order Date</p>
                    <p className="font-gill-sans font-semibold text-gray-900">
                      {orderDetails.orderDate
                        ? new Date(orderDetails.orderDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-gray-400 mt-1 flex items-center justify-center">
                    <span className="text-xs font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-gill-sans">Total Amount</p>
                    <p className="font-gill-sans font-semibold text-gray-900">
                      LE {orderDetails.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 font-gill-sans">Email</p>
                    <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.customerEmail}</p>
                  </div>
                </div>
                {orderDetails.customerPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 font-gill-sans">Phone</p>
                      <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.customerPhone}</p>
                    </div>
                  </div>
                )}
                {orderDetails.customerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 font-gill-sans">Delivery Address</p>
                      <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.customerAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            {orderDetails.items && orderDetails.items.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-gill-sans font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600 font-gill-sans">
                          Quantity: {item.quantity} × LE {item.unitPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                        </p>
                      </div>
                      <p className="font-gill-sans font-semibold text-gray-900">
                        LE {item.totalPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-gill-sans">Payment Status</p>
                  <p className="font-gill-sans font-semibold text-gray-900 capitalize">
                    {orderDetails.paymentStatus || "Pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading...</p>
        </div>
      </div>
    }>
      <TrackOrderPageContent />
    </Suspense>
  )
}

