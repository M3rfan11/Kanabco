"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Package, Heart, Settings, LogOut, Edit, X, Trash2, ShoppingCart } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { useCart } from "../contexts/CartContext"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface UserProfile {
  id: number
  fullName: string
  email: string
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  roles: string[]
}

export default function AccountPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist" | "settings">("profile")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  })
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  // Refetch wishlist when switching to wishlist tab
  useEffect(() => {
    if (activeTab === "wishlist" && isAuthenticated) {
      fetchWishlist()
    }
  }, [activeTab, isAuthenticated])

  const checkAuthAndFetchData = async () => {
    const token = sessionStorage.getItem("authToken")
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent("/account")}`)
      return
    }

    try {
      // Fetch user profile
      const profileRes = await fetch(`${API_BASE_URL}/api/UserProfile/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setUserProfile(profileData)
        setIsAuthenticated(true)

        // Fetch user orders
        try {
          const ordersRes = await fetch(`${API_BASE_URL}/api/CustomerOrder/orders`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            setOrders(ordersData)
          }
        } catch (error) {
          console.error("Error fetching orders:", error)
        }

        // Fetch wishlist
        fetchWishlist(token)
      } else {
        // Token invalid, redirect to login
        sessionStorage.removeItem("authToken")
        router.push(`/login?redirect=${encodeURIComponent("/account")}`)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      sessionStorage.removeItem("authToken")
      router.push(`/login?redirect=${encodeURIComponent("/account")}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("authToken")
    setIsAuthenticated(false)
    router.push("/")
  }

  const fetchWishlist = async (token?: string) => {
    const authToken = token || sessionStorage.getItem("authToken")
    if (!authToken) {
      console.log("No auth token, skipping wishlist fetch")
      return
    }

    try {
      setIsLoadingWishlist(true)
      console.log("Fetching wishlist...")
      const res = await fetch(`${API_BASE_URL}/api/Wishlist`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const data = await res.json()
        console.log("Wishlist data received:", data)
        setWishlistItems(data)
      } else {
        console.error("Failed to fetch wishlist:", res.status, res.statusText)
        const errorText = await res.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setIsLoadingWishlist(false)
    }
  }

  const handleRemoveFromWishlist = async (wishlistId: number) => {
    const token = sessionStorage.getItem("authToken")
    if (!token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/Wishlist/${wishlistId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId))
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    }
  }

  const handleAddToCartFromWishlist = (item: any) => {
    addToCart({
      productId: item.productId,
      variantId: item.productVariantId || null,
      name: item.productName,
      price: item.productPrice,
      image: item.productImageUrl || "/placeholder.svg",
      quantity: 1,
      color: item.variantAttributes ? JSON.parse(item.variantAttributes).Color || "" : "",
      size: item.variantAttributes ? JSON.parse(item.variantAttributes).Size || "" : "",
      sku: item.productSKU || "",
    })
  }

  const handleOpenEditModal = () => {
    if (userProfile) {
      setEditForm({
        fullName: userProfile.fullName,
        email: userProfile.email,
        phone: userProfile.phone || "",
        address: userProfile.address || "",
      })
      setEditError("")
      setEditSuccess("")
      setShowEditModal(true)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError("")
    setEditSuccess("")
    setIsSavingProfile(true)

    const token = sessionStorage.getItem("authToken")
    if (!token) {
      setEditError("You must be logged in to update your profile")
      setIsSavingProfile(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/UserProfile/profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone || null,
          address: editForm.address || null,
        }),
      })

      if (res.ok) {
        const updatedProfile = await res.json()
        setUserProfile(updatedProfile)
        setEditSuccess("Profile updated successfully!")
        setTimeout(() => {
          setShowEditModal(false)
          setEditSuccess("")
        }, 1500)
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to update profile" }))
        setEditError(errorData.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setEditError("An error occurred while updating your profile. Please try again.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    setIsChangingPassword(true)

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match")
      setIsChangingPassword(false)
      return
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      setIsChangingPassword(false)
      return
    }

    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        setPasswordError("You must be logged in to change your password")
        setIsChangingPassword(false)
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/UserProfile/change-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (res.ok) {
        setPasswordSuccess("Password changed successfully!")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        // Clear success message after 5 seconds
        setTimeout(() => {
          setPasswordSuccess("")
        }, 5000)
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to change password" }))
        setPasswordError(errorData.message || "Failed to change password. Please check your current password.")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("An error occurred while changing your password. Please try again.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 font-gill-sans">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile) {
    return null // Will redirect
  }

  // Split full name into first and last name
  const nameParts = userProfile.fullName.split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

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
                <h2 className="text-lg font-oblong font-bold text-gray-900">{userProfile.fullName}</h2>
                <p className="text-sm text-gray-600 font-gill-sans">{userProfile.email}</p>
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

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors mt-8"
              >
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
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={handleOpenEditModal}>
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
                        <p className="font-gill-sans text-gray-900">{firstName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Last Name</label>
                        <p className="font-gill-sans text-gray-900">{lastName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Email</label>
                        <p className="font-gill-sans text-gray-900">{userProfile.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-gill-sans text-gray-600 mb-1">Phone</label>
                        <p className="font-gill-sans text-gray-900">{userProfile.phone || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-oblong font-bold text-gray-900 mb-4">Default Address</h3>
                    <div className="space-y-2">
                      {userProfile.address ? (
                        <p className="font-gill-sans text-gray-900 whitespace-pre-line">{userProfile.address}</p>
                      ) : (
                        <p className="font-gill-sans text-gray-500">Not set</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Order History</h1>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-gill-sans">No orders yet</p>
                      <p className="text-sm text-gray-500 font-gill-sans mt-2">Start shopping to see your orders here</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-gill-sans font-medium text-gray-900">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600 font-gill-sans">
                            {new Date(order.orderDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-gill-sans font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Shipped"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-gill-sans">{order.items?.length || 0} items</p>
                          <p className="font-gill-sans font-medium">
                            LE {order.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/track-order?orderNumber=${order.orderNumber}&email=${encodeURIComponent(userProfile.email)}`)}
                          >
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
                  ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Wishlist</h1>

                {isLoadingWishlist ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 font-gill-sans">Loading wishlist...</p>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-gill-sans">Your wishlist is empty</p>
                    <p className="text-sm text-gray-500 font-gill-sans mt-2">Start adding products to your wishlist</p>
                    <Link href="/collections">
                      <Button className="mt-4 bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <Link href={`/product/${item.productId}`}>
                          <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                            <Image
                              src={item.productImageUrl || "/placeholder.svg"}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="font-gill-sans font-medium text-gray-900 mb-2 hover:text-[#ed6b3e] transition-colors">
                            {item.productName}
                          </h3>
                        </Link>
                        {item.variantAttributes && (
                          <p className="text-sm text-gray-600 font-gill-sans mb-2">
                            {typeof item.variantAttributes === 'string' 
                              ? JSON.parse(item.variantAttributes).Color || JSON.parse(item.variantAttributes).Size || ""
                              : item.variantAttributes}
                          </p>
                        )}
                        <p className="font-gill-sans font-bold text-gray-900 mb-4">
                          LE {item.productPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans"
                            onClick={() => handleAddToCartFromWishlist(item)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Add to Cart
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                      {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600 font-gill-sans">{passwordError}</p>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-600 font-gill-sans">{passwordSuccess}</p>
                        </div>
                      )}
                      <input
                        type="password"
                        placeholder="Current password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        required
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      />
                      <Button 
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-burnt-orange text-white font-gill-sans disabled:opacity-50"
                      >
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-oblong font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-gill-sans">{editError}</p>
                </div>
              )}
              {editSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 font-gill-sans">{editSuccess}</p>
                </div>
              )}

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g., +20 123 456 7890"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Default Address</Label>
                <textarea
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter your full address"
                  rows={3}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-[#ed6b3e] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
