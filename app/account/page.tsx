"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { User, Package, Heart, Settings, LogOut, Edit } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist" | "settings">("profile")

  const recentOrders = [
    {
      id: "KAN-2024-001234",
      date: "January 20, 2024",
      status: "Processing",
      total: 161141.0,
      items: 3,
    },
    {
      id: "KAN-2024-001233",
      date: "January 15, 2024",
      status: "Delivered",
      total: 85000.0,
      items: 2,
    },
  ]

  const wishlistItems = [
    {
      id: "modern-sofa-1",
      name: "Embrace Lounge Sofa",
      price: 324062.0,
      image: "/placeholder.svg?height=100&width=100&text=Modern+Sofa",
    },
    {
      id: "pendant-light-2",
      name: "Aura Pendant Lamp",
      price: 35875.0,
      image: "/placeholder.svg?height=100&width=100&text=Pendant+Light",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-oblong font-bold text-gray-900">John Doe</h2>
                <p className="text-sm text-gray-600 font-gill-sans">john.doe@email.com</p>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "orders", label: "Orders", icon: Package },
                { id: "wishlist", label: "Wishlist", icon: Heart },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id ? "bg-[#ed6b3e] text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-gill-sans">{item.label}</span>
                </button>
              ))}

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors mt-8">
                <LogOut className="w-5 h-5" />
                <span className="font-gill-sans">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-oblong font-bold text-gray-900">Profile Information</h1>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">First Name</label>
                        <p className="font-gill-sans text-gray-900">John</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Last Name</label>
                        <p className="font-gill-sans text-gray-900">Doe</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Email</label>
                        <p className="font-gill-sans text-gray-900">john.doe@email.com</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Phone</label>
                        <p className="font-gill-sans text-gray-900">+20 123 456 7890</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Default Address</h3>
                    <div className="space-y-2">
                      <p className="font-gill-sans text-gray-900">123 Main Street, Apt 4B</p>
                      <p className="font-gill-sans text-gray-900">Cairo, Egypt 11511</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Order History</h1>

                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-gill-sans font-medium text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600 font-gill-sans">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-gill-sans font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-gill-sans">{order.items} items</p>
                          <p className="font-gill-sans font-medium">
                            LE {order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {order.status === "Delivered" && (
                            <Button variant="outline" size="sm">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Wishlist</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-gill-sans font-medium text-gray-900 mb-2">{item.name}</h3>
                      <p className="font-gill-sans font-bold text-gray-900 mb-4">
                        LE {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          Add to Cart
                        </Button>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Account Settings</h1>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Email Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox"  className=" accent-[#18395c]" />
                        <span className="font-gill-sans">Order updates and shipping notifications</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox"  className="text-burnt-orange accent-[#18395c]" />
                        <span className="font-gill-sans">New product announcements</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="text-burnt-orange accent-[#18395c]" />
                        <span className="font-gill-sans">Promotional offers and discounts</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Privacy Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox"  className="text-burnt-orange accent-[#18395c]" />
                        <span className="font-gill-sans">Allow personalized recommendations</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="text-burnt-orang accent-[#18395c]e" />
                        <span className="font-gill-sans">Share data for analytics</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Change Password</h3>
                    <div className="max-w-md space-y-4">
                      <input
                        type="password"
                        placeholder="Current password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <Button className="bg-burnt-orange text-white font-gill-sans">Update Password</Button>
                    </div>
                  </div>
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
