"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Package, Mail, Phone, MapPin, Calendar, ArrowRight } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

function OrderConfirmationPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get("orderNumber")
  const email = searchParams.get("email")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderNumber || !email) {
      // Redirect to home if no order number or email
      router.push("/")
      return
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/CustomerOrder/track-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderNumber: orderNumber,
            email: email,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setOrderDetails(data)
        } else {
          console.error("Failed to fetch order details")
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderNumber, email, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-8 py-16 text-center">
          <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 font-gill-sans mb-8">
            We couldn't find your order. Please check your order number and email.
          </p>
          <Link href="/">
            <Button className="bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold px-8 py-3 rounded-full">
              Return to Home
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

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Success Icon and Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600 font-gill-sans mb-2">
            Thank you for your order. We've received it and will process it shortly.
          </p>
          <p className="text-sm text-gray-500 font-gill-sans">
            Order Number: <span className="font-semibold text-gray-900">{orderNumber}</span>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-oblong font-bold text-gray-900 mb-6">Order Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Order Information */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-gill-sans">Order Number</p>
                  <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.orderNumber || orderNumber}</p>
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
                      : new Date().toLocaleDateString()}
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
                  <p className="font-gill-sans font-semibold text-gray-900">{orderDetails.customerEmail || email}</p>
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

          {/* Order Status */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-gill-sans">Order Status</p>
                <p className="font-gill-sans font-semibold text-gray-900 capitalize">{orderDetails.status || "Pending"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-gill-sans">Payment Status</p>
                <p className="font-gill-sans font-semibold text-gray-900 capitalize">{orderDetails.paymentStatus || "Pending"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">What's Next?</h3>
          <ul className="space-y-2 text-gray-700 font-gill-sans">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You'll receive an email confirmation at <strong>{orderDetails.customerEmail || email}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>We'll process your order and notify you when it ships</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You can track your order using your order number and email</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/collections">
            <Button className="w-full sm:w-auto bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold px-8 py-3 rounded-full">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/account">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto font-gill-sans px-8 py-3 rounded-full"
            >
              View My Orders
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationPageContent />
    </Suspense>
  )
}



