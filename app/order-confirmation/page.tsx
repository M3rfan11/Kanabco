"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, Truck, MapPin, Calendar } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


export default function OrderConfirmationPage() {
  const orderNumber = "KAN-2024-001234"
  const estimatedDelivery = "January 25, 2024"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-oblong font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 font-gill-sans">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-gill-sans">Order Number:</span>
                  <span className="font-gill-sans font-medium">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-gill-sans">Order Date:</span>
                  <span className="font-gill-sans font-medium">January 20, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-gill-sans">Total Amount:</span>
                  <span className="font-gill-sans font-medium">LE 161,141.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-gill-sans">Payment Method:</span>
                  <span className="font-gill-sans font-medium">Credit Card</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-gill-sans font-medium">John Doe</p>
                    <p className="text-gray-600 font-gill-sans text-sm">
                      123 Main Street, Apt 4B
                      <br />
                      Cairo, Egypt 11511
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-gill-sans font-medium">Estimated Delivery</p>
                    <p className="text-gray-600 font-gill-sans text-sm">{estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-oblong font-bold text-gray-900 mb-6">Order Status</h2>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-gill-sans font-medium">Order Placed</p>
              <p className="text-xs text-gray-500 font-gill-sans">Jan 20, 2024</p>
            </div>

            <div className="flex-1 h-px bg-gray-300 mx-4"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-gill-sans font-medium">Processing</p>
              <p className="text-xs text-gray-500 font-gill-sans">1-2 days</p>
            </div>

            <div className="flex-1 h-px bg-gray-300 mx-4"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-gill-sans font-medium">Shipped</p>
              <p className="text-xs text-gray-500 font-gill-sans">Pending</p>
            </div>

            <div className="flex-1 h-px bg-gray-300 mx-4"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-gill-sans font-medium">Delivered</p>
              <p className="text-xs text-gray-500 font-gill-sans">Pending</p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-oblong font-bold text-gray-900 mb-4">What's Next?</h2>
          <div className="space-y-4 text-gray-600 font-gill-sans">
            <p>• You'll receive an email confirmation shortly with your order details.</p>
            <p>• We'll send you tracking information once your order ships.</p>
            <p>• Our team will contact you if we need any additional information.</p>
            <p>• You can track your order status anytime in your account.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account/orders">
            <Button
              className="px-8 py-3 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#18395c" }}
            >
              Track Your Order
            </Button>
          </Link>
          <Link href="/collections">
            <Button
              variant="outline"
              className="px-8 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-gill-sans font-semibold tracking-wide bg-transparent"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 font-gill-sans mb-4">Need help with your order?</p>
          <Link href="/contact" className="text-burnt-orange hover:text-burnt-orange/80 font-gill-sans font-medium">
            Contact our support team
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
