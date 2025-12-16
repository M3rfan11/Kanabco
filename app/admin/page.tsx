"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Package, FolderTree, ShoppingCart, Users, TrendingUp, AlertCircle, Plus, Edit, Trash2, X, Upload, ChevronLeft, ChevronRight, GripVertical, Search, Filter, ChevronDown, ChevronUp, Shield, DollarSign, Calendar, User, Mail, Phone, MapPin, CreditCard, CheckCircle2, Clock, Truck, XCircle, Loader2 } from "lucide-react"

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalInventory: number
  totalUsers: number
  totalRevenue: number
  totalCosts: number
  pendingSales: number
  lowStockItems: number
}

interface LowStockItem {
  type: string
  id: number
  productId: number
  productName: string
  productSKU: string | null
  variantId: number | null
  variantAttributes: string | null
  warehouseId: number
  warehouseName: string
  quantity: number
  unit: string | null
  minimumStockLevel: number | null
  maximumStockLevel: number | null
  isOutOfStock: boolean
  isNotAvailable: boolean
  severity: string
  updatedAt: string | null
}

interface Category {
  id: number
  name: string
  description: string | null
  isActive: boolean
  productCount: number
}

interface ProductVariant {
  id?: number
  color?: string // Legacy - kept for backward compatibility
  colorHex?: string | null // Legacy
  attributes?: string | null // JSON object of variant attributes (e.g., {"Color": "Red", "Size": "Large"})
  imageUrl?: string | null
  mediaUrls?: string | null // JSON array of image URLs
  priceOverride?: number | null
  sku?: string | null
  isActive: boolean
}

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  compareAtPrice?: number | null
  cost?: number | null
  taxable?: boolean
  unit?: string | null
  sku: string | null
  barcode?: string | null
  inventoryTracked?: boolean
  sellWhenOutOfStock?: boolean
  alwaysAvailable?: boolean
  isPhysicalProduct?: boolean
  weight?: number | null
  dimensions?: string | null
  packageLength?: number | null
  packageWidth?: number | null
  packageHeight?: number | null
  countryOfOrigin?: string | null
  brand: string | null
  vendor?: string | null
  productType?: string | null
  tags?: string | null
  status?: "Draft" | "Active" | number // Can be string or number (0=Draft, 1=Active) from API
  publishingChannels?: string | null
  imageUrl: string | null
  mediaUrls?: string | null
  variantAttributes?: string | null // JSON array of variant attribute definitions (e.g., ["Color", "Size", "Material"])
  categoryId: number // Legacy - primary category
  categoryName: string // Legacy - primary category name
  categoryIds?: number[] // All category IDs
  categoryNames?: string[] // All category names
  isActive: boolean
  totalQuantity: number
  inventories?: Array<{ warehouseName?: string; quantity?: number }>
  variants?: ProductVariant[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Component for multi-step variant selection (supports any number of attributes)
function VariantSelector({ 
  product, 
  allImageUrls, 
  productCardImageIndex, 
  setProductCardImageIndex,
  selectedVariant,
  setSelectedVariant
}: { 
  product: Product
  allImageUrls: string[]
  productCardImageIndex: Record<number, number>
  setProductCardImageIndex: (value: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant | null) => void
}) {
  // Parse variant attributes
  const activeVariants = product.variants?.filter((v: any) => v.isActive) || []
  
  // Get attribute names - ONLY from product.variantAttributes, never infer from variants
  let attributeNames: string[] = []
  try {
    if (product.variantAttributes) {
      attributeNames = typeof product.variantAttributes === 'string' 
        ? JSON.parse(product.variantAttributes) 
        : product.variantAttributes
      // Ensure it's an array
      if (!Array.isArray(attributeNames)) {
        attributeNames = []
      }
    }
  } catch (e) {
    console.error("Error parsing variantAttributes:", e)
    attributeNames = []
  }
  
  // Only use product.variantAttributes - don't infer from variants
  // This ensures deleted attributes don't appear
  
  // Track selected values for each attribute step
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({})
  
  // Get unique values for the first attribute
  const getValuesForAttribute = (attrName: string, filterAttrs: Record<string, string> = {}): string[] => {
    const valueSet = new Set<string>()
    activeVariants.forEach((variant: any) => {
      try {
        let attrs: Record<string, string> = {}
        if (variant.attributes) {
          attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
        } else if (variant.color && attrName === "Color") {
          attrs = { Color: variant.color }
        }
        
        // Only consider attributes that are in the product's variantAttributes list
        // Filter out any attributes that were deleted from the product config
        const filteredAttrs: Record<string, string> = {}
        Object.keys(attrs).forEach(key => {
          if (attributeNames.includes(key)) {
            filteredAttrs[key] = attrs[key]
          }
        })
        
        // Check if this variant matches all previous filter attributes
        const matchesFilters = Object.keys(filterAttrs).every(key => filteredAttrs[key] === filterAttrs[key])
        if (matchesFilters && filteredAttrs[attrName]) {
          valueSet.add(filteredAttrs[attrName])
        }
      } catch {
        // Skip invalid variants
      }
    })
    return Array.from(valueSet)
  }
  
  // Get variants that match the current selection
  const getMatchingVariants = (): Array<{ variant: any; displayLabel: string }> => {
    const matchingVariants: Array<{ variant: any; displayLabel: string }> = []
    
    activeVariants.forEach((variant: any) => {
      try {
        let attrs: Record<string, string> = {}
        if (variant.attributes) {
          attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
        } else if (variant.color) {
          attrs = { Color: variant.color }
        }
        
        // Only consider attributes that are in the product's variantAttributes list
        // Filter out any attributes that were deleted from the product config
        const filteredAttrs: Record<string, string> = {}
        Object.keys(attrs).forEach(key => {
          if (attributeNames.includes(key)) {
            filteredAttrs[key] = attrs[key]
          }
        })
        
        // Check if this variant matches all selected values (using filtered attributes)
        const matches = Object.keys(selectedValues).every(key => filteredAttrs[key] === selectedValues[key])
        if (matches) {
          // Build display label from remaining attributes (only from attributeNames)
          const remainingAttrs = Object.keys(filteredAttrs).filter(key => !selectedValues[key])
          const displayLabel = remainingAttrs.length > 0 
            ? remainingAttrs.map(key => filteredAttrs[key]).join(" / ")
            : Object.values(filteredAttrs).join(" / ")
          matchingVariants.push({ variant, displayLabel })
        }
      } catch {
        // Skip invalid variants
      }
    })
    
    return matchingVariants
  }
  
  // Auto-select first value for first attribute on mount
  useEffect(() => {
    if (attributeNames.length > 0 && Object.keys(selectedValues).length === 0) {
      const firstValues = getValuesForAttribute(attributeNames[0])
      if (firstValues.length > 0) {
        setSelectedValues({ [attributeNames[0]]: firstValues[0] })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeNames.length])
  
  // Determine which attribute to show next
  const getCurrentStepAttribute = (): string | null => {
    // Find the first attribute that hasn't been selected yet
    for (const attrName of attributeNames) {
      if (!selectedValues[attrName]) {
        return attrName
      }
    }
    return null
  }
  
  const currentStepAttr = getCurrentStepAttribute()
  const currentStepValues = currentStepAttr ? getValuesForAttribute(currentStepAttr, selectedValues) : []
  const matchingVariants = getMatchingVariants()
  
  // Find image index for a variant
  const findVariantImageIndex = (variant: any): number => {
    let variantImageUrls: string[] = []
    try {
      if (variant.mediaUrls) {
        const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
        variantImageUrls = Array.isArray(parsed) ? parsed : []
      }
      if (variantImageUrls.length === 0 && variant.imageUrl) {
        variantImageUrls = [variant.imageUrl]
      }
    } catch {
      if (variant.imageUrl) {
        variantImageUrls = [variant.imageUrl]
      }
    }
    
    if (variantImageUrls.length === 0) return -1
    const firstVariantImage = variantImageUrls[0]
    return allImageUrls.findIndex(img => img === firstVariantImage)
  }
  
  return (
    <div className="pt-4 border-t border-gray-200">
      {/* Dynamic attribute selection steps */}
      {attributeNames.map((attrName, stepIndex) => {
        const isCurrentStep = currentStepAttr === attrName
        const isCompleted = selectedValues[attrName] !== undefined
        const isFutureStep = !isCurrentStep && !isCompleted
        
        // Get values for this attribute based on previous selections
        const filterAttrs: Record<string, string> = {}
        for (let i = 0; i < stepIndex; i++) {
          const prevAttr = attributeNames[i]
          if (selectedValues[prevAttr]) {
            filterAttrs[prevAttr] = selectedValues[prevAttr]
          }
        }
        const attrValues = getValuesForAttribute(attrName, filterAttrs)
        
        // Only hide future steps (steps that haven't been reached yet)
        // Show current step and completed steps (so users can change them)
        if (isFutureStep || attrValues.length === 0) return null
        
        return (
          <div key={attrName} className={stepIndex > 0 ? "mt-3" : ""}>
            <p className="text-xs text-gray-500 mb-2">{attrName}:</p>
            <div className="flex flex-wrap gap-2">
              {attrValues.map((value) => {
                const isSelected = selectedValues[attrName] === value
                return (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // Allow clicking on current step or completed steps (to change selection)
                      if (isCurrentStep || isCompleted) {
                        console.log(`Clicking on ${attrName}: ${value}`, { isCurrentStep, isCompleted, stepIndex })
                        
                        // Build new selected values - keep previous selections up to this step, clear subsequent ones
                        const newSelectedValues: Record<string, string> = {}
                        for (let i = 0; i < stepIndex; i++) {
                          const prevAttr = attributeNames[i]
                          if (selectedValues[prevAttr]) {
                            newSelectedValues[prevAttr] = selectedValues[prevAttr]
                          }
                        }
                        // Set the new value for this attribute
                        newSelectedValues[attrName] = value
                        
                        console.log('Updating selected values:', newSelectedValues)
                        setSelectedValues(newSelectedValues)
                        setSelectedVariant(null) // Reset selected variant when attribute changes
                        
                        // If this is the last attribute, check if we can auto-select
                        if (stepIndex === attributeNames.length - 1) {
                          // Find matching variants with the new selection
                          const matching: Array<{ variant: any; displayLabel: string }> = []
                          activeVariants.forEach((variant: any) => {
                            try {
                              let attrs: Record<string, string> = {}
                              if (variant.attributes) {
                                attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
                              } else if (variant.color) {
                                attrs = { Color: variant.color }
                              }
                              
                              // Only consider attributes that are in the product's variantAttributes list
                              // Filter out any attributes that were deleted from the product config
                              const filteredAttrs: Record<string, string> = {}
                              Object.keys(attrs).forEach(key => {
                                if (attributeNames.includes(key)) {
                                  filteredAttrs[key] = attrs[key]
                                }
                              })
                              
                              // Check if this variant matches all selected values including the new one (using filtered attributes)
                              const matches = Object.keys(newSelectedValues).every(key => filteredAttrs[key] === newSelectedValues[key])
                              if (matches) {
                                const displayLabel = Object.values(filteredAttrs).join(" / ")
                                matching.push({ variant, displayLabel })
                              }
                            } catch {
                              // Skip invalid variants
                            }
                          })
                          
                          // Auto-select if only one match
                          if (matching.length === 1) {
                            setTimeout(() => {
                              setSelectedVariant(matching[0].variant)
                              const variantImageIndex = findVariantImageIndex(matching[0].variant)
                              if (variantImageIndex >= 0) {
                                setProductCardImageIndex((prev) => ({
                                  ...prev,
                                  [product.id]: variantImageIndex
                                }))
                              }
                            }, 0)
                          }
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      
      {/* Final variant selection (when all attributes are selected) */}
      {currentStepAttr === null && matchingVariants.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Select Variant:</p>
          <div className="flex flex-wrap gap-2">
            {matchingVariants.map(({ variant, displayLabel }, idx) => {
              const variantImageIndex = findVariantImageIndex(variant)
              let variantImageUrls: string[] = []
              try {
                if (variant.mediaUrls) {
                  const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
                  variantImageUrls = Array.isArray(parsed) ? parsed : []
                }
                if (variantImageUrls.length === 0 && variant.imageUrl) {
                  variantImageUrls = [variant.imageUrl]
                }
              } catch {
                if (variant.imageUrl) {
                  variantImageUrls = [variant.imageUrl]
                }
              }
              
              const isSelected = selectedVariant?.id === variant.id
              
              return (
                <button
                  key={variant.id || idx}
                  className={`px-3 py-1.5 rounded text-xs cursor-pointer transition-all relative border ${
                    isSelected
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                  title={`${displayLabel} - Click to view images and select variant`}
                  onClick={() => {
                    // Set selected variant
                    setSelectedVariant(variant)
                    
                    // Navigate to variant's images in carousel
                    if (variantImageIndex >= 0) {
                      setProductCardImageIndex((prev) => ({
                        ...prev,
                        [product.id]: variantImageIndex
                      }))
                    }
                  }}
                >
                  <span>{displayLabel || "Variant"}</span>
                  {variantImageUrls.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                      {variantImageUrls.length}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "categories" | "inventory" | "orders" | "sales" | "customers" | "promocodes">("dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [salesData, setSalesData] = useState<any>(null)
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({})
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    taxable: true,
    unit: "piece",
    sku: "",
    barcode: "",
    inventoryTracked: true,
    sellWhenOutOfStock: false,
    alwaysAvailable: false,
    isPhysicalProduct: true,
    weight: "",
    dimensions: "",
    packageLength: "",
    packageWidth: "",
    packageHeight: "",
    countryOfOrigin: "",
    brand: "",
    vendor: "",
    productType: "",
    tags: "",
    status: "Active" as "Draft" | "Active",
    publishingChannels: "Online Store",
    imageUrl: "",
    mediaUrls: "",
    variantAttributes: "", // JSON array of variant attribute definitions
    categoryId: "", // Legacy - primary category
    categoryIds: [] as number[], // Multiple categories
  })
  const [productImages, setProductImages] = useState<string[]>([])
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([])
  const [editingInventory, setEditingInventory] = useState<{ productId: number; variantId?: number; quantity: number | string } | null>(null)
  const [variantInventories, setVariantInventories] = useState<Record<number, Array<{ variantId: number; warehouseId: number; warehouseName: string; quantity: number }>>>({})
  const [productCardImageIndex, setProductCardImageIndex] = useState<Record<number, number>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<number, ProductVariant | null>>({})
  const [viewingVariantImages, setViewingVariantImages] = useState<{ productId: number; variantId: number; images: string[]; variantName: string } | null>(null)
  const [variantImageIndex, setVariantImageIndex] = useState(0)
  
  // Variant configuration state
  const [variantConfig, setVariantConfig] = useState<Record<string, string[]>>({}) // e.g., { "Color": ["Black", "Red"], "Size": ["X", "XL"] }
  const [variantGroupBy, setVariantGroupBy] = useState<string>("") // Group variants by this attribute
  const [variantSearch, setVariantSearch] = useState<string>("")
  // Images per attribute value: Only ONE attribute can have images (e.g., only "Color" values have images)
  // Format: { "Color": { "Black": [img1, img2], "Red": [img3] } } - only one attribute key
  const [attributeValueImages, setAttributeValueImages] = useState<Record<string, Record<string, string[]>>>({})
  const [imageAttribute, setImageAttribute] = useState<string>("") // Which attribute to use for images (e.g., "Color")
  // Color hex values per attribute value: Store color hex for each color value
  // Format: { "Color": { "Black": "#000000", "Red": "#ff0000" } }
  const [attributeValueColorHex, setAttributeValueColorHex] = useState<Record<string, Record<string, string>>>({})
  
  // Inventory filter state
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<number | "all">("all")

  const fetchUserPermissions = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        console.warn("No auth token found for permissions fetch")
        return
      }

      // Fetch user info to get roles
      try {
        const userResponse = await fetch(`${API_BASE_URL}/api/Auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          const roles = userData.roles || []
          console.log("User roles fetched:", roles)
          setUserRoles(roles)
          
          // If user has no roles, try to fix it
          if (roles.length === 0 && userData.email === "admin@example.com") {
            console.warn("Admin user has no roles. Attempting to fix...")
            try {
              const fixResponse = await fetch(`${API_BASE_URL}/api/Auth/fix-admin-role`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
              })
              if (fixResponse.ok) {
                const fixData = await fixResponse.json()
                console.log("Role fix result:", fixData)
                alert("SuperAdmin role has been assigned. Please log out and log back in to get a new token with the role.")
              }
            } catch (err) {
              console.warn("Could not fix role:", err)
            }
          }
        } else {
          console.warn("Could not fetch user info:", userResponse.status)
        }
      } catch (err) {
        console.warn("Error fetching user info:", err)
      }

      // Fetch permissions - if this fails, dashboard should still work
      try {
        const response = await fetch(`${API_BASE_URL}/api/permissions/my-permissions`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })

        if (response.ok) {
          const permissions = await response.json()
          setUserPermissions(permissions)
          setPermissionsLoaded(true)
        } else {
          const errorText = await response.text().catch(() => "")
          console.warn(`Permissions endpoint returned ${response.status}:`, errorText)
          // If permissions can't be fetched, set empty permissions - tabs will still show based on roles
          setUserPermissions({})
          setPermissionsLoaded(true)
        }
      } catch (err) {
        console.warn("Error fetching permissions:", err)
        // Don't break the dashboard if permissions can't be fetched
        setUserPermissions({})
        setPermissionsLoaded(true)
      }
    } catch (error) {
      console.error("Error in fetchUserPermissions:", error)
      // Set empty permissions so dashboard can still work
      setUserPermissions({})
      setPermissionsLoaded(true)
    }
  }

  const hasPermission = (resource: string, action: string = "Read"): boolean => {
    // SuperAdmin has all permissions
    if (userRoles.includes("SuperAdmin")) {
      return true
    }
    
    const resourcePermissions = userPermissions[resource] || []
    return resourcePermissions.includes(action)
  }

  useEffect(() => {
    // Check if user is already authenticated
    const token = sessionStorage.getItem("authToken")
    if (token) {
      setIsAuthenticated(true)
      setShowLogin(false)
      fetchUserPermissions()
      fetchData()
    } else {
      setIsAuthenticated(false)
      setShowLogin(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      // If user is on inventory tab but doesn't have permission, redirect to dashboard
      if (activeTab === "inventory" && !hasPermission("Inventory", "Read") && !userRoles.includes("SuperAdmin")) {
        setActiveTab("dashboard")
        return
      }
      // If user is on categories tab but doesn't have permission, redirect to dashboard
      if (activeTab === "categories" && !hasPermission("Categories", "Read") && !userRoles.includes("SuperAdmin")) {
        setActiveTab("dashboard")
        return
      }
      // If user is on products tab but doesn't have permission, redirect to dashboard
      if (activeTab === "products" && !hasPermission("Products", "Read") && !userRoles.includes("SuperAdmin")) {
        setActiveTab("dashboard")
        return
      }
      fetchData()
    }
  }, [activeTab, isAuthenticated, userRoles, userPermissions])

  // When a variant is selected, ensure its inventory is loaded
  useEffect(() => {
    Object.entries(selectedVariants).forEach(([productIdStr, variant]) => {
      if (variant && variant.id) {
        const productId = parseInt(productIdStr)
        const product = products.find(p => p.id === productId)
        if (product && product.variants && product.variants.length > 0) {
          // Check if inventory for this variant is already loaded
          const productVariantInventories = variantInventories[productId] || []
          const variantInventory = productVariantInventories.find(vi => vi.variantId === variant.id)
          
          if (!variantInventory) {
            // Variant inventory not loaded, fetch it
            console.log(`[Variant Selection] Fetching inventory for variant ${variant.id} (${JSON.stringify(variant.attributes)}) of product ${productId}`)
            fetchVariantInventories(productId)
          } else {
            console.log(`[Variant Selection] Stock for variant ${variant.id} (${JSON.stringify(variant.attributes)}): ${variantInventory.quantity} pieces`)
          }
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariants])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log("Login response:", data)
        
        // Handle both camelCase (accessToken) and PascalCase (AccessToken) from API
        const token = data.accessToken || data.AccessToken
        if (!token) {
          console.error("No token in login response:", data)
          setLoginError("Login successful but no token received. Please try again.")
          return
        }
        
        // Log user roles from login response
        const userRoles = data.user?.roles || data.User?.roles || []
        console.log("✅ Login successful! User roles from login:", userRoles)
        
        if (userRoles.length === 0) {
          console.warn("⚠️ WARNING: User has no roles! This will cause 403 errors.")
          console.warn("The SuperAdmin role may not be assigned in the database.")
        } else if (!userRoles.includes("SuperAdmin") && loginForm.email === "admin@example.com") {
          console.warn("⚠️ WARNING: admin@example.com doesn't have SuperAdmin role!")
          console.warn("The role will be auto-assigned on next login, but you may need to log in again.")
        }
        
        sessionStorage.setItem("authToken", token)
        console.log("Token stored successfully, length:", token.length)
        
        setIsAuthenticated(true)
        setShowLogin(false)
        
        // Fetch user permissions and data
        await fetchUserPermissions()
        fetchData()
      } else {
        const errorText = await res.text()
        console.error("Login failed:", res.status, errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText || "Login failed" }
        }
        setLoginError(errorData.message || "Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("Cannot connect to server. Please make sure the backend is running.")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get auth token from sessionStorage (per-tab storage for testing different roles)
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        console.warn("No auth token found in localStorage")
        setLoading(false)
        return
      }
      
      console.log("Fetching data with token (length):", token.length)
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }

      if (activeTab === "dashboard") {
        // Fetch dashboard stats
        try {
          const statsRes = await fetch(`${API_BASE_URL}/api/Dashboard/stats`, { headers })
          if (statsRes.ok) {
            const data = await statsRes.json()
            setStats(data)
          } else if (statsRes.status === 401) {
            console.error("Authentication required. Please log in.")
            setStats(null)
          } else if (statsRes.status === 403) {
            console.error("Access denied. You may not have permission to view dashboard stats.")
            setStats(null)
          } else {
            console.error("Failed to fetch stats:", statsRes.statusText)
            setStats(null)
          }
        } catch (error) {
          console.error("Error fetching dashboard stats:", error)
          setStats(null)
        }
        
        // Also fetch categories for the Collections Overview section
        // Only fetch if user has Categories.Read permission
        if (hasPermission("Categories", "Read") || userRoles.includes("SuperAdmin")) {
          const categoriesRes = await fetch(`${API_BASE_URL}/api/Category`, { headers })
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json()
            setCategories(categoriesData.filter((c: Category) => c.isActive))
          }
        }
        
        // Fetch low stock items if user has Inventory.Read permission
        if (hasPermission("Inventory", "Read") || userRoles.includes("SuperAdmin")) {
          try {
            const lowStockRes = await fetch(`${API_BASE_URL}/api/Dashboard/low-stock-items`, { headers })
            if (lowStockRes.ok) {
              const lowStockData = await lowStockRes.json()
              setLowStockItems(lowStockData)
            } else if (lowStockRes.status === 403) {
              console.warn("Access denied for low stock items. User doesn't have Inventory.Read permission.")
              setLowStockItems([])
            } else {
              console.warn("Failed to fetch low stock items:", lowStockRes.statusText)
              setLowStockItems([])
            }
          } catch (error) {
            console.error("Error fetching low stock items:", error)
            setLowStockItems([])
          }
        }

        // Fetch sales data to calculate real revenue
        if (hasPermission("Sales", "Read") || userRoles.includes("SuperAdmin")) {
          try {
            const salesRes = await fetch(`${API_BASE_URL}/api/Sales`, { headers })
            if (salesRes.ok) {
              const orders = await salesRes.json()
              
              // Calculate real revenue: Only delivered/completed orders count as sales, but down payments are always included
              const deliveredOrders = orders.filter((o: any) => o.status === "Delivered" || o.status === "Completed")
              const deliveredRevenue = deliveredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
              
              // Down payments from non-delivered/non-completed orders count as sales
              const nonDeliveredOrders = orders.filter((o: any) => o.status !== "Delivered" && o.status !== "Completed")
              const downPaymentsFromNonDelivered = nonDeliveredOrders.reduce((sum: number, order: any) => sum + (order.downPayment || 0), 0)
              
              // Total sales = delivered/completed orders revenue + down payments from non-delivered orders
              const totalSales = deliveredRevenue + downPaymentsFromNonDelivered
              
              setSalesData({ totalSales })
            }
          } catch (error) {
            console.error("Error fetching sales data:", error)
            setSalesData(null)
          }
        }
      } else if (activeTab === "categories") {
        // Only fetch if user has Categories.Read permission
        if (hasPermission("Categories", "Read") || userRoles.includes("SuperAdmin")) {
          const categoriesRes = await fetch(`${API_BASE_URL}/api/Category/all`, { headers })
          if (categoriesRes.ok) {
            const data = await categoriesRes.json()
            // Filter out inactive categories (safety check)
            setCategories(data.filter((c: Category) => c.isActive))
          } else if (categoriesRes.status === 401) {
            console.error("Authentication required. Please log in.")
          } else if (categoriesRes.status === 403) {
            console.error("Access denied. You need Categories.Read permission.")
          } else {
            console.error("Failed to fetch categories:", categoriesRes.statusText)
          }
        }
      } else if (activeTab === "products" || activeTab === "inventory" || activeTab === "orders" || activeTab === "sales" || activeTab === "customers") {
        // Fetch products and categories when on products/inventory tab
        // Only fetch categories if user has permission
        const fetchPromises: Promise<Response>[] = [
          fetch(`${API_BASE_URL}/api/Product/all`, { headers })
        ]
        
        // Only fetch categories if user has Categories.Read permission
        if (hasPermission("Categories", "Read") || userRoles.includes("SuperAdmin")) {
          fetchPromises.push(fetch(`${API_BASE_URL}/api/Category/all`, { headers }))
        }
        
        const responses = await Promise.all(fetchPromises)
        const productsRes = responses[0]
        const categoriesRes = responses[1] // May be undefined if not fetched
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        } else {
          console.error("Failed to fetch products:", productsRes.status, productsRes.statusText)
          if (productsRes.status === 401) {
            console.error("Authentication required. Please log in again.")
          } else if (productsRes.status === 403) {
            console.error("Access denied. You need Products.Read permission.")
          }
          setProducts([])
        }
        
        if (categoriesRes && categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.filter((c: Category) => c.isActive))
        } else if (categoriesRes && categoriesRes.status === 401) {
          console.error("Authentication required for categories. Please log in.")
        } else if (categoriesRes && categoriesRes.status === 403) {
          console.error("Access denied for categories. You need Categories.Read permission.")
        }
      } else if (activeTab === "promocodes") {
        // Fetch promo codes, customers (registered + from orders), and products
        const fetchPromises: Promise<Response>[] = [
          fetch(`${API_BASE_URL}/api/PromoCode`, { headers }),
          fetch(`${API_BASE_URL}/api/PromoCode/customers`, { headers }),
          fetch(`${API_BASE_URL}/api/Product/all`, { headers })
        ]
        
        const responses = await Promise.all(fetchPromises)
        const promoCodesRes = responses[0]
        const customersRes = responses[1]
        const productsRes = responses[2]
        
        if (promoCodesRes.ok) {
          const promoCodesData = await promoCodesRes.json()
          setPromoCodes(promoCodesData)
        } else {
          const errorText = await promoCodesRes.text().catch(() => promoCodesRes.statusText)
          console.error(`Failed to fetch promo codes: ${promoCodesRes.status} ${promoCodesRes.statusText}`, errorText)
          if (promoCodesRes.status === 401) {
            console.error("Authentication required. Please log in again.")
          } else if (promoCodesRes.status === 403) {
            console.error("Access denied. You need PromoCodes.Read permission or SuperAdmin role.")
          } else if (promoCodesRes.status === 404) {
            console.error("PromoCode endpoint not found. Make sure the backend is running and has the PromoCodeController.")
          }
          setPromoCodes([])
        }
        
        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setUsers(customersData) // Store customers in users state for now
        } else {
          console.error("Failed to fetch customers:", customersRes.statusText)
          setUsers([])
        }
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        } else {
          console.error("Failed to fetch products:", productsRes.statusText)
          setProducts([])
        }
        
        setLoading(false)
        return
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("Cannot connect to backend API. Make sure the backend is running on http://localhost:8080")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/Category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || null,
          isActive: true,
        }),
      })

      if (res.ok) {
        setShowCategoryModal(false)
        setCategoryForm({ name: "", description: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Error creating category:", error)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const token = sessionStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/Category/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || null,
        }),
      })

      if (res.ok) {
        setShowCategoryModal(false)
        setEditingCategory(null)
        setCategoryForm({ name: "", description: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        alert("You must be logged in to delete categories")
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/Category/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (res.ok) {
        // Remove the deleted category from state immediately
        setCategories(prevCategories => prevCategories.filter(c => c.id !== id))
        // Also refresh data to ensure consistency
        fetchData()
        alert("Category deleted successfully")
      } else {
        const errorText = await res.text().catch(() => "")
        let errorMessage = "Failed to delete category"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          if (errorText) errorMessage = errorText
        }
        
        if (res.status === 403) {
          errorMessage = "Access denied. You need Categories.Delete permission or SuperAdmin role."
        } else if (res.status === 401) {
          errorMessage = "Authentication required. Please log in again."
          sessionStorage.removeItem("authToken")
          setIsAuthenticated(false)
          setShowLogin(true)
        }
        
        console.error("Delete category error:", res.status, errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("An error occurred while deleting the category")
    }
  }

  const handleCreateProduct = async () => {
    try {
      // Validation
      if (!productForm.name || productForm.name.trim() === "") {
        alert("Product name is required")
        return
      }
      
      if (!productForm.categoryId || productForm.categoryId === "") {
        alert("Please select a category")
        return
      }
      
      // Use categoryIds if available, otherwise fall back to categoryId
      const categoryIdsToUse = productForm.categoryIds.length > 0 
        ? productForm.categoryIds 
        : (productForm.categoryId ? [parseInt(productForm.categoryId)] : [])
      
      if (categoryIdsToUse.length === 0) {
        alert("Please select at least one category.")
        return
      }
      
      // Use first category as primary for backward compatibility
      const categoryIdNum = categoryIdsToUse[0]
      
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }
      
      // Always send mediaUrls - use productImages if available, otherwise empty array
      const mediaUrlsToSend = productImages.length > 0 
        ? JSON.stringify(productImages) 
        : "[]"
      
      // Check if any images are base64 (data URLs)
      const base64Images = productImages.filter(img => img.startsWith('data:'))
      const hasBase64Images = base64Images.length > 0
      
      console.log("Creating product with images:", {
        imageCount: productImages.length,
        base64ImageCount: base64Images.length,
        mediaUrlsLength: mediaUrlsToSend.length,
        hasBase64Images: hasBase64Images,
        firstImagePreview: productImages[0]?.substring(0, 100) + "...",
        categoryId: productForm.categoryId,
        name: productForm.name
      })
      
      // Warn if mediaUrls is too long
      if (mediaUrlsToSend.length > 45000) {
        console.warn("Warning: MediaUrls is very long (" + mediaUrlsToSend.length + " chars). Consider compressing images.")
      }
      
      const requestBody = {
          name: productForm.name,
          description: productForm.description || null,
        price: parseFloat(productForm.price) || 0,
        compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
        cost: productForm.cost ? parseFloat(productForm.cost) : null,
        taxable: productForm.taxable,
        unit: productForm.unit || "piece",
          sku: productForm.sku || null,
        barcode: productForm.barcode || null,
        inventoryTracked: productForm.inventoryTracked,
        sellWhenOutOfStock: productForm.sellWhenOutOfStock,
        alwaysAvailable: productForm.alwaysAvailable,
        isPhysicalProduct: productForm.isPhysicalProduct,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        dimensions: productForm.dimensions || null,
        packageLength: productForm.packageLength ? parseFloat(productForm.packageLength) : null,
        packageWidth: productForm.packageWidth ? parseFloat(productForm.packageWidth) : null,
        packageHeight: productForm.packageHeight ? parseFloat(productForm.packageHeight) : null,
        countryOfOrigin: productForm.countryOfOrigin || null,
          brand: productForm.brand || null,
        vendor: productForm.vendor || null,
        productType: productForm.productType || null,
        tags: productForm.tags || null,
        status: productForm.status === "Active" ? 1 : 0, // Convert string to enum: Active = 1, Draft = 0
        publishingChannels: productForm.publishingChannels || "Online Store",
        imageUrl: productImages.length > 0 ? productImages[0] : productForm.imageUrl || null,
        mediaUrls: mediaUrlsToSend,
        variantAttributes: productForm.variantAttributes || null,
        categoryId: categoryIdNum, // Legacy - primary category
        categoryIds: categoryIdsToUse, // Multiple categories
        isActive: productForm.status === "Active",
        variants: productVariants.length > 0 ? productVariants.map(v => {
          const variantImages = Array.isArray(v.mediaUrls) ? v.mediaUrls : v.imageUrl ? [v.imageUrl] : []
          return {
            color: v.color || "", // Legacy - kept for backward compatibility
            colorHex: v.colorHex || null, // Legacy
            attributes: v.attributes || null, // Flexible attributes as JSON
            imageUrl: variantImages.length > 0 ? variantImages[0] : v.imageUrl || null,
            mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
            priceOverride: v.priceOverride || null,
            sku: v.sku || null,
            isActive: v.isActive,
          }
        }) : null,
      }
      
      console.log("Sending create request:", {
        ...requestBody,
        mediaUrls: mediaUrlsToSend.substring(0, 200) + "...",
        variants: requestBody.variants?.length || 0
      })
      
      const res = await fetch(`${API_BASE_URL}/api/Product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        const responseData = await res.json().catch(() => null)
        console.log("Product created successfully:", {
          productId: responseData?.id,
          savedMediaUrls: responseData?.mediaUrls ? responseData.mediaUrls.substring(0, 100) + "..." : null,
          savedMediaUrlsLength: responseData?.mediaUrls?.length || 0
        })
        
        setShowProductModal(false)
        setProductForm({
          name: "",
          description: "",
          price: "",
          compareAtPrice: "",
          cost: "",
          taxable: true,
          unit: "piece",
          sku: "",
          barcode: "",
          inventoryTracked: true,
          sellWhenOutOfStock: false,
          alwaysAvailable: false,
          isPhysicalProduct: true,
          weight: "",
          dimensions: "",
          packageLength: "",
          packageWidth: "",
          packageHeight: "",
          countryOfOrigin: "",
          brand: "",
          vendor: "",
          productType: "",
          tags: "",
          status: "Active",
          publishingChannels: "Online Store",
          imageUrl: "",
          mediaUrls: "",
          variantAttributes: "",
          categoryId: "",
          categoryIds: [],
        })
        setProductVariants([])
        fetchData()
      } else {
        let errorText = ""
        let errorJson = null
        
        try {
          const contentType = res.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            errorJson = await res.json()
            errorText = errorJson?.message || errorJson?.title || JSON.stringify(errorJson)
          } else {
            errorText = await res.text()
          }
        } catch (e) {
          errorText = `Unable to read error message: ${e instanceof Error ? e.message : 'Unknown error'}`
        }
        
        console.error("Product creation failed:", {
          status: res.status,
          statusText: res.statusText,
          error: errorText,
          errorJson: errorJson,
          mediaUrlsLength: mediaUrlsToSend.length,
          requestBody: {
            name: productForm.name,
            categoryId: productForm.categoryId,
            imageCount: productImages.length,
            hasImages: productImages.length > 0
          }
        })
        
        const errorMessage = errorJson?.message || errorJson?.title || errorText || `${res.status} ${res.statusText}`
        alert(`Failed to create product: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error creating product:", error)
      alert(`Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      const token = sessionStorage.getItem("authToken")
      
      // Always send mediaUrls - use productImages if available, otherwise empty array
      const mediaUrlsToSend = productImages.length > 0 
        ? JSON.stringify(productImages) 
        : "[]"
      
      // Check if any images are base64 (data URLs)
      const base64Images = productImages.filter(img => img.startsWith('data:'))
      const hasBase64Images = base64Images.length > 0
      
      console.log("Updating product with images:", {
        productId: editingProduct.id,
        imageCount: productImages.length,
        base64ImageCount: base64Images.length,
        mediaUrlsLength: mediaUrlsToSend.length,
        hasBase64Images: hasBase64Images,
        firstImagePreview: productImages[0]?.substring(0, 100) + "..."
      })
      
      // Warn if mediaUrls is too long (though we increased the limit)
      if (mediaUrlsToSend.length > 45000) {
        console.warn("Warning: MediaUrls is very long (" + mediaUrlsToSend.length + " chars). Consider compressing images.")
      }
      
      const res = await fetch(`${API_BASE_URL}/api/Product/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description || null,
          price: parseFloat(productForm.price) || 0,
          compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
          cost: productForm.cost ? parseFloat(productForm.cost) : null,
          taxable: productForm.taxable,
          unit: productForm.unit || "piece",
          sku: productForm.sku || null,
          barcode: productForm.barcode || null,
          inventoryTracked: productForm.inventoryTracked,
          sellWhenOutOfStock: productForm.sellWhenOutOfStock,
          alwaysAvailable: productForm.alwaysAvailable,
          isPhysicalProduct: productForm.isPhysicalProduct,
          weight: productForm.weight ? parseFloat(productForm.weight) : null,
          dimensions: productForm.dimensions || null,
          packageLength: productForm.packageLength ? parseFloat(productForm.packageLength) : null,
          packageWidth: productForm.packageWidth ? parseFloat(productForm.packageWidth) : null,
          packageHeight: productForm.packageHeight ? parseFloat(productForm.packageHeight) : null,
          countryOfOrigin: productForm.countryOfOrigin || null,
          brand: productForm.brand || null,
          vendor: productForm.vendor || null,
          productType: productForm.productType || null,
          tags: productForm.tags || null,
          status: productForm.status === "Active" ? 1 : 0, // Convert string to enum: Active = 1, Draft = 0
          publishingChannels: productForm.publishingChannels || "Online Store",
          imageUrl: productImages.length > 0 ? productImages[0] : productForm.imageUrl || null,
          mediaUrls: mediaUrlsToSend,
          variantAttributes: productForm.variantAttributes || null,
          categoryId: productForm.categoryId && !isNaN(parseInt(productForm.categoryId)) ? parseInt(productForm.categoryId) : (productForm.categoryIds && productForm.categoryIds.length > 0 ? productForm.categoryIds[0] : undefined), // Legacy - primary category, ensure valid number
          categoryIds: productForm.categoryIds.length > 0 ? productForm.categoryIds : (productForm.categoryId && !isNaN(parseInt(productForm.categoryId)) ? [parseInt(productForm.categoryId)] : []), // Multiple categories, ensure valid numbers
          isActive: productForm.status ? (productForm.status === "Active") : (editingProduct?.isActive ?? true), // Preserve existing status if not explicitly set
        }),
      })

      if (res.ok) {
        const responseData = await res.json().catch(() => null)
        console.log("Product update successful:", {
          productId: editingProduct.id,
          savedMediaUrls: responseData?.mediaUrls ? responseData.mediaUrls.substring(0, 100) + "..." : null,
          savedMediaUrlsLength: responseData?.mediaUrls?.length || 0
        })
        
        // Regenerate variants with latest images from attribute values before saving
        if (Object.keys(variantConfig).length > 0 && imageAttribute) {
          console.log("Regenerating variants with attribute value images before saving...")
          console.log("Attribute value images:", attributeValueImages)
          generateVariantsFromConfig()
          // Wait for state to update
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        // Save variants after updating product
        if (productVariants.length > 0) {
          try {
            await handleSaveVariants(editingProduct.id)
          } catch (error) {
            console.error("Error saving variants:", error)
            // Don't close modal if variants fail to save
            return
          }
        }
        
        setShowProductModal(false)
        setEditingProduct(null)
        setProductForm({
          name: "",
          description: "",
          price: "",
          compareAtPrice: "",
          cost: "",
          taxable: true,
          unit: "piece",
          sku: "",
          barcode: "",
          inventoryTracked: true,
          sellWhenOutOfStock: false,
          alwaysAvailable: false,
          isPhysicalProduct: true,
          weight: "",
          dimensions: "",
          packageLength: "",
          packageWidth: "",
          packageHeight: "",
          countryOfOrigin: "",
          brand: "",
          vendor: "",
          productType: "",
          tags: "",
          status: "Active",
          publishingChannels: "Online Store",
          imageUrl: "",
          mediaUrls: "",
          variantAttributes: "",
          categoryId: "",
          categoryIds: [],
        })
        setProductImages([])
        setProductVariants([])
        fetchData()
      } else {
        const errorText = await res.text()
        console.error("Product update failed:", {
          status: res.status,
          statusText: res.statusText,
          error: errorText,
          mediaUrlsLength: mediaUrlsToSend.length
        })
        alert(`Failed to update product: ${res.status} ${res.statusText}\n${errorText}`)
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        alert("You must be logged in to delete products")
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/Product/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (res.ok) {
        // Remove the deleted product from state immediately
        setProducts(prevProducts => prevProducts.filter(p => p.id !== id))
        // Also refresh data to ensure consistency
        fetchData()
        alert("Product deleted successfully")
      } else {
        const errorText = await res.text().catch(() => "")
        let errorMessage = "Failed to delete product"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          if (errorText) errorMessage = errorText
        }
        
        if (res.status === 403) {
          errorMessage = "Access denied. You need Products.Delete permission or SuperAdmin role."
        } else if (res.status === 401) {
          errorMessage = "Authentication required. Please log in again."
          sessionStorage.removeItem("authToken")
          setIsAuthenticated(false)
          setShowLogin(true)
        }
        
        console.error("Delete product error:", res.status, errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("An error occurred while deleting the product")
    }
  }

  const handleUpdateInventory = async (productId: number, warehouseId: number, quantity: number) => {
    try {
      const token = sessionStorage.getItem("authToken")
      const res = await fetch(`${API_BASE_URL}/api/Product/${productId}/inventory/${warehouseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          quantity: quantity,
          unit: "piece",
        }),
      })

      if (res.ok) {
        setEditingInventory(null)
        fetchData()
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to update inventory" }))
        alert(errorData.message || "Failed to update inventory")
      }
    } catch (error) {
      console.error("Error updating inventory:", error)
      alert("Failed to update inventory. Please try again.")
    }
  }

  const handleUpdateOnlineStock = async (productId: number, quantity: number, variantId?: number) => {
    try {
      const token = sessionStorage.getItem("authToken")
      
      // First, get the online warehouse ID
      const product = products.find(p => p.id === productId)
      if (!product) {
        alert("Product not found")
        return
      }
      
      const inventories = (product as any).inventories || []
      const onlineInventory = inventories.find((inv: any) => 
        inv.warehouseName?.toLowerCase().includes("online") || 
        inv.warehouseName?.toLowerCase().includes("store")
      )
      
      if (!onlineInventory) {
        alert("Online inventory not found for this product")
        return
      }

      // If variantId is provided, update variant inventory; otherwise update product inventory
      if (variantId) {
        const url = `${API_BASE_URL}/api/VariantInventory/variant/${variantId}/warehouse/${onlineInventory.warehouseId}`
        console.log(`Updating variant inventory: ${url}`, { variantId, warehouseId: onlineInventory.warehouseId, quantity })
        
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            quantity: quantity,
            unit: "piece",
          }),
        })

        if (res.ok) {
          const updatedInventory = await res.json().catch(() => null)
          console.log("Variant inventory updated successfully:", updatedInventory)
          setEditingInventory(null)
          // Refresh variant inventories for this product
          await fetchVariantInventories(productId)
          await fetchData()
          // Show success message
          alert(`Stock updated successfully! Variant now has ${quantity} piece${quantity !== 1 ? 's' : ''} in stock.`)
        } else {
          const errorText = await res.text().catch(() => "Unknown error")
          console.error(`Failed to update variant inventory: ${res.status} ${res.statusText}`, errorText)
          let errorMessage = "Failed to update variant inventory"
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
          alert(errorMessage)
        }
      } else {
        // Update product inventory (legacy)
        const res = await fetch(`${API_BASE_URL}/api/Product/${productId}/inventory/${onlineInventory.warehouseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            quantity: quantity,
            unit: "piece",
          }),
        })

        if (res.ok) {
          setEditingInventory(null)
          // Refresh both product data and variant inventories to get updated stock
          await fetchVariantInventories(productId)
          await fetchData()
          alert(`Stock updated successfully! Product now has ${quantity} piece${quantity !== 1 ? 's' : ''} in stock.`)
        } else {
          const errorData = await res.json().catch(() => ({ message: "Failed to update inventory" }))
          alert(errorData.message || "Failed to update inventory")
        }
      }
    } catch (error) {
      console.error("Error updating inventory:", error)
      alert("Failed to update inventory. Please try again.")
    }
  }

  // Fetch variant inventories for a product
  const fetchVariantInventories = async (productId: number) => {
    try {
      const token = sessionStorage.getItem("authToken")
      const product = products.find(p => p.id === productId)
      if (!product || !product.variants) {
        console.log(`Product ${productId} has no variants`)
        return
      }

      const variantInventoriesMap: Record<number, Array<{ variantId: number; warehouseId: number; warehouseName: string; quantity: number }>> = {}

      // Get online warehouse ID
      const inventories = (product as any).inventories || []
      const onlineInventory = inventories.find((inv: any) => 
        inv.warehouseName?.toLowerCase().includes("online") || 
        inv.warehouseName?.toLowerCase().includes("store")
      )
      
      if (!onlineInventory) {
        console.log(`Product ${productId} has no online inventory warehouse`)
        return
      }

      const activeVariants = product.variants.filter((v: any) => v.isActive && v.id)
      if (activeVariants.length === 0) {
        return
      }

      console.log(`Fetching variant inventories for product ${productId} (${activeVariants.length} variants), warehouse ${onlineInventory.warehouseId}`)

      // Use parallel individual requests (optimized - all requests happen simultaneously)
      // This is faster than sequential requests and works even if batch endpoint has issues
      const variantIds = activeVariants.filter((v: any) => v.id).map((v: any) => v.id)
      
      try {
        // Fetch all variant inventories in parallel
        const inventoryPromises = variantIds.map(async (variantId: number) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/VariantInventory/variant/${variantId}`, {
              headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            })
            
            if (res.ok) {
              const variantInventories = await res.json()
              const onlineVariantInventory = variantInventories.find((vi: any) => vi.warehouseId === onlineInventory.warehouseId)
              return {
                variantId,
                warehouseId: onlineInventory.warehouseId,
                warehouseName: onlineVariantInventory?.warehouseName || onlineInventory.warehouseName || "Online Store",
                quantity: onlineVariantInventory?.quantity || 0
              }
            } else if (res.status === 404) {
              // No inventory exists, return 0 stock
              return {
                variantId,
                warehouseId: onlineInventory.warehouseId,
                warehouseName: onlineInventory.warehouseName || "Online Store",
                quantity: 0
              }
            }
            return null
          } catch (error) {
            console.error(`Error fetching inventory for variant ${variantId}:`, error)
            return null
          }
        })
        
        const results = await Promise.all(inventoryPromises)
        variantInventoriesMap[productId] = results.filter((r): r is { variantId: number; warehouseId: number; warehouseName: string; quantity: number } => r !== null)
        
        console.log(`Variant inventories for product ${productId}:`, variantInventoriesMap[productId])
        setVariantInventories(prev => ({
          ...prev,
          ...variantInventoriesMap
        }))
        return
      } catch (error) {
        console.error(`Error fetching variant inventories in parallel:`, error)
      }

      // Fallback to individual requests if batch fails
      // Fetch inventory for each variant
      for (const variant of activeVariants) {
        if (!variant.id) {
          console.warn(`Variant has no ID:`, variant)
          continue
        }
        
        try {
          const url = `${API_BASE_URL}/api/VariantInventory/variant/${variant.id}`
          console.log(`Fetching variant inventory from: ${url}`)
          
          const res = await fetch(url, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          })
          
          if (res.status === 404) {
            console.log(`No inventory found for variant ${variant.id} (this is OK - will show 0 stock)`)
            // Initialize with 0 stock if no inventory exists
            if (!variantInventoriesMap[productId]) {
              variantInventoriesMap[productId] = []
            }
            variantInventoriesMap[productId].push({
              variantId: variant.id,
              warehouseId: onlineInventory.warehouseId,
              warehouseName: onlineInventory.warehouseName || "Online Store",
              quantity: 0
            })
          } else if (res.ok) {
            const variantInventories = await res.json()
            console.log(`Variant ${variant.id} inventories:`, variantInventories)
            
            const onlineVariantInventory = variantInventories.find((vi: any) => vi.warehouseId === onlineInventory.warehouseId)
            
            if (onlineVariantInventory) {
              if (!variantInventoriesMap[productId]) {
                variantInventoriesMap[productId] = []
              }
              variantInventoriesMap[productId].push({
                variantId: variant.id,
                warehouseId: onlineVariantInventory.warehouseId,
                warehouseName: onlineVariantInventory.warehouseName,
                quantity: onlineVariantInventory.quantity
              })
            } else {
              // No inventory for this warehouse, initialize with 0
              if (!variantInventoriesMap[productId]) {
                variantInventoriesMap[productId] = []
              }
              variantInventoriesMap[productId].push({
                variantId: variant.id,
                warehouseId: onlineInventory.warehouseId,
                warehouseName: onlineInventory.warehouseName || "Online Store",
                quantity: 0
              })
            }
          } else {
            const errorText = await res.text().catch(() => "Unknown error")
            console.error(`Error fetching inventory for variant ${variant.id}: ${res.status} ${res.statusText}`, errorText)
          }
        } catch (error) {
          console.error(`Error fetching inventory for variant ${variant.id}:`, error)
        }
      }

      console.log(`Variant inventories for product ${productId}:`, variantInventoriesMap[productId])
      setVariantInventories(prev => ({
        ...prev,
        ...variantInventoriesMap
      }))
    } catch (error) {
      console.error("Error fetching variant inventories:", error)
    }
  }

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || "",
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", description: "" })
    }
    setShowCategoryModal(true)
  }

  const openProductModal = async (product?: Product) => {
    // Ensure categories are loaded before opening modal
    if (categories.length === 0) {
      try {
        const token = sessionStorage.getItem("authToken")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        const categoriesRes = await fetch(`${API_BASE_URL}/api/Category/all`, { headers })
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.filter((c: Category) => c.isActive))
        } else {
          console.error("Failed to fetch categories:", categoriesRes.statusText)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() || "",
        cost: product.cost?.toString() || "",
        taxable: product.taxable ?? true,
        unit: product.unit || "piece",
        sku: product.sku || "",
        barcode: product.barcode || "",
        inventoryTracked: product.inventoryTracked ?? true,
        sellWhenOutOfStock: product.sellWhenOutOfStock ?? false,
        alwaysAvailable: product.alwaysAvailable ?? false,
        isPhysicalProduct: product.isPhysicalProduct ?? true,
        weight: product.weight?.toString() || "",
        dimensions: product.dimensions || "",
        packageLength: product.packageLength?.toString() || "",
        packageWidth: product.packageWidth?.toString() || "",
        packageHeight: product.packageHeight?.toString() || "",
        countryOfOrigin: product.countryOfOrigin || "",
        brand: product.brand || "",
        vendor: product.vendor || "",
        productType: product.productType || "",
        tags: product.tags || "",
        status: (typeof product.status === "number" ? (product.status === 1 ? "Active" : "Draft") : (product.status || "Active")), // Convert enum (1=Active, 0=Draft) to string
        publishingChannels: product.publishingChannels || "Online Store",
        imageUrl: product.imageUrl || "",
        mediaUrls: product.mediaUrls || "",
        variantAttributes: product.variantAttributes || "",
        categoryId: product.categoryId?.toString() || "",
        categoryIds: product.categoryIds && product.categoryIds.length > 0 ? product.categoryIds : (product.categoryId ? [product.categoryId] : []), // Load all category IDs
      })
      
      // Load product images from mediaUrls
      let loadedProductImages: string[] = []
      try {
        if (product.mediaUrls) {
          const parsed = JSON.parse(product.mediaUrls)
          loadedProductImages = Array.isArray(parsed) ? parsed : []
        }
        // Fallback to imageUrl if no mediaUrls
        if (loadedProductImages.length === 0 && product.imageUrl) {
          loadedProductImages = [product.imageUrl]
        }
      } catch {
        // If parsing fails, use imageUrl as fallback
        if (product.imageUrl) {
          loadedProductImages = [product.imageUrl]
        }
      }
      setProductImages(loadedProductImages)
      
      // Fetch variants for this product
      try {
        const token = sessionStorage.getItem("authToken")
        const variantsRes = await fetch(`${API_BASE_URL}/api/ProductVariant/product/${product.id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        if (variantsRes.ok) {
          const variants = await variantsRes.json()
          const loadedVariants = variants.map((v: any) => {
            let variantImages: string[] = []
            try {
              const mediaUrls = v.mediaUrls ? JSON.parse(v.mediaUrls) : []
              variantImages = Array.isArray(mediaUrls) ? mediaUrls : []
              // Fallback to imageUrl if no mediaUrls
              if (variantImages.length === 0 && v.imageUrl) {
                variantImages = [v.imageUrl]
              }
            } catch {
              variantImages = v.imageUrl ? [v.imageUrl] : []
            }
            return {
            id: v.id,
            attributes: v.attributes,
            color: v.color,
            colorHex: v.colorHex,
            imageUrl: v.imageUrl,
              mediaUrls: variantImages,
            priceOverride: v.priceOverride,
            sku: v.sku,
            isActive: v.isActive,
            }
          })
          setProductVariants(loadedVariants)
          
          // Load variant configuration and attribute value images from existing variants
          if (loadedVariants.length > 0) {
            const config: Record<string, string[]> = {}
            const valueImages: Record<string, Record<string, string[]>> = {}
            const valueColorHex: Record<string, Record<string, string>> = {}
            
            loadedVariants.forEach((v: ProductVariant) => {
              try {
                if (v.attributes) {
                  const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
                  if (typeof attrs === 'object' && attrs !== null) {
                    Object.keys(attrs).forEach(key => {
                      if (!config[key]) {
                        config[key] = []
                      }
                      if (!config[key].includes(attrs[key])) {
                        config[key].push(attrs[key])
                      }
                      
                      // Extract images for this attribute value from variant
                      const variantImages = Array.isArray(v.mediaUrls) ? v.mediaUrls : []
                      if (variantImages.length > 0) {
                        if (!valueImages[key]) {
                          valueImages[key] = {}
                        }
                        if (!valueImages[key][attrs[key]]) {
                          valueImages[key][attrs[key]] = []
                        }
                        // Add variant images to this attribute value (avoid duplicates)
                        variantImages.forEach((img: string) => {
                          if (!valueImages[key][attrs[key]].includes(img)) {
                            valueImages[key][attrs[key]].push(img)
                          }
                        })
                      }
                      
                      // Extract colorHex for Color attribute values
                      if (key.toLowerCase() === "color" && v.colorHex) {
                        if (!valueColorHex[key]) {
                          valueColorHex[key] = {}
                        }
                        // Only set if not already set (to avoid overwriting with different values)
                        if (!valueColorHex[key][attrs[key]]) {
                          valueColorHex[key][attrs[key]] = v.colorHex
                        }
                      }
                    })
                  }
                }
              } catch {
                // Skip invalid attributes
              }
            })
            setVariantConfig(config)
            setAttributeValueImages(valueImages)
            setAttributeValueColorHex(valueColorHex)
            if (Object.keys(config).length > 0) {
              setVariantGroupBy(Object.keys(config)[0]) // Default group by first attribute
            }
          } else {
            setVariantConfig({})
            setAttributeValueImages({})
            setAttributeValueColorHex({})
            setVariantGroupBy("")
          }
        }
      } catch (error) {
        console.error("Error fetching variants:", error)
        setProductVariants([])
        setVariantConfig({})
        setAttributeValueImages({})
        setAttributeValueColorHex({})
        setVariantGroupBy("")
      }
    } else {
      setEditingProduct(null)
      setProductForm({
        name: "",
        description: "",
        price: "",
        compareAtPrice: "",
        cost: "",
        taxable: true,
        unit: "piece",
        sku: "",
        barcode: "",
        inventoryTracked: true,
        sellWhenOutOfStock: false,
        alwaysAvailable: false,
        isPhysicalProduct: true,
        weight: "",
        dimensions: "",
        packageLength: "",
        packageWidth: "",
        packageHeight: "",
        countryOfOrigin: "",
        brand: "",
        vendor: "",
        productType: "",
        tags: "",
        status: "Active",
        publishingChannels: "Online Store",
        imageUrl: "",
        mediaUrls: "",
        variantAttributes: "",
        categoryId: "",
        categoryIds: [],
      })
      setProductImages([])
      setProductVariants([])
      setVariantConfig({})
      setAttributeValueImages({})
      setVariantGroupBy("")
    }
    setShowProductModal(true)
  }

  // Helper function to get contrast color (black or white) for text on colored background
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '')
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Helper function to get variant label from attributes
  const getVariantLabel = (variant: ProductVariant): string => {
    try {
      if (variant.attributes) {
        const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
        if (typeof attrs === 'object' && attrs !== null) {
          const label = Object.entries(attrs).map(([key, value]) => `${key}: ${value}`).join(", ")
          if (label) return label
        }
      }
    } catch {
      // Fallback to color if attributes parsing fails
    }
    return variant.color || "Variant"
  }

  // Helper function to generate all combinations (Cartesian product)
  const generateVariantCombinations = (config: Record<string, string[]>): Array<Record<string, string>> => {
    const attributes = Object.keys(config)
    if (attributes.length === 0) return []
    
    const values = attributes.map(attr => config[attr] || [])
    const combinations: Array<Record<string, string>> = []
    
    // Recursive function to generate combinations
    const generate = (index: number, current: Record<string, string>) => {
      if (index === attributes.length) {
        combinations.push({ ...current })
        return
      }
      
      const attrName = attributes[index]
      const attrValues = values[index]
      
      for (const value of attrValues) {
        current[attrName] = value
        generate(index + 1, current)
      }
    }
    
    generate(0, {})
    return combinations
  }

  // Get images for a variant - only from the selected image attribute value
  const getVariantImages = (variantAttrs: Record<string, string>): string[] => {
    // Only use images from the selected image attribute (e.g., "Color")
    if (!imageAttribute || !variantAttrs[imageAttribute]) {
      return []
    }
    
    const attrValue = variantAttrs[imageAttribute]
    const images = attributeValueImages[imageAttribute]?.[attrValue] || []
    console.log(`getVariantImages: ${imageAttribute}:${attrValue} = ${images.length} images`, images)
    return images
  }

  // Generate variants from configuration
  // Optional updatedColorHex parameter allows passing the latest colorHex values before state updates
  const generateVariantsFromConfig = (updatedColorHex?: Record<string, Record<string, string>>) => {
    // Use provided updatedColorHex or fall back to state
    const colorHexToUse = updatedColorHex || attributeValueColorHex
    
    const combinations = generateVariantCombinations(variantConfig)
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      // Check if variant already exists
      const existingVariant = productVariants.find(v => {
        try {
          if (v.attributes) {
            const attrs = JSON.parse(v.attributes)
            return Object.keys(combo).every(key => attrs[key] === combo[key])
          }
        } catch {
          return false
        }
        return false
      })
      
      // Get images for this variant from attribute values
      const variantImages = getVariantImages(combo)
      console.log(`Variant ${index}: ${JSON.stringify(combo)} has ${variantImages.length} images`, variantImages)
      
      // Get colorHex if this variant has a Color attribute
      let variantColorHex: string | null = null
      const colorAttrName = Object.keys(combo).find(attr => attr.toLowerCase() === "color")
      if (colorAttrName && combo[colorAttrName]) {
        const colorValue = combo[colorAttrName]
        // Always check colorHexToUse first - if it exists, use it (even if it's different from existing)
        if (colorHexToUse[colorAttrName]?.[colorValue]) {
          variantColorHex = colorHexToUse[colorAttrName][colorValue]
        } else if (existingVariant?.colorHex) {
          // Only fall back to existing if not set in colorHexToUse
          variantColorHex = existingVariant.colorHex
        }
        // Ensure it's a valid hex format
        if (variantColorHex && !variantColorHex.startsWith("#")) {
          variantColorHex = `#${variantColorHex}`
        }
      }
      
      if (existingVariant) {
        // Update existing variant's images from attribute values, but preserve other fields
        // ALWAYS use the new colorHex from attributeValueColorHex if it exists, otherwise keep existing
        const updatedVariant = {
          ...existingVariant,
          mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
          imageUrl: variantImages.length > 0 ? variantImages[0] : null,
          colorHex: variantColorHex, // Use the computed colorHex (prioritizes attributeValueColorHex)
        }
        console.log(`Updated existing variant:`, {
          ...updatedVariant,
          colorValue: colorAttrName ? combo[colorAttrName] : null,
          colorHexFromState: colorAttrName ? colorHexToUse[colorAttrName]?.[combo[colorAttrName]] : null,
          finalColorHex: variantColorHex
        })
        return updatedVariant
      }
      
      return {
        id: undefined,
        attributes: JSON.stringify(combo),
        color: undefined, // No longer using color
        colorHex: variantColorHex,
        imageUrl: variantImages.length > 0 ? variantImages[0] : null,
        mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
        priceOverride: null,
        sku: null,
        isActive: true,
      }
    })
    
    console.log("Generated variants with images:", newVariants.map(v => {
      let imageCount = 0
      if (v.mediaUrls) {
        if (typeof v.mediaUrls === 'string') {
          try {
            const parsed = JSON.parse(v.mediaUrls)
            imageCount = Array.isArray(parsed) ? parsed.length : 0
          } catch {
            imageCount = 0
          }
        } else if (v.mediaUrls && typeof v.mediaUrls === 'object' && Array.isArray(v.mediaUrls)) {
          imageCount = (v.mediaUrls as string[]).length
        }
      }
      return {
        attributes: v.attributes,
        mediaUrls: v.mediaUrls,
        imageUrl: v.imageUrl,
        imageCount: imageCount
      }
    }))
    
    setProductVariants(newVariants)
  }

  // Update variant config and regenerate variants
  const updateVariantConfig = (newConfig: Record<string, string[]>) => {
    setVariantConfig(newConfig)
    // Update productForm.variantAttributes to store the config
    const attributeNames = Object.keys(newConfig)
    setProductForm({ ...productForm, variantAttributes: JSON.stringify(attributeNames) })
    
    // Clean up images for removed attribute values
    const newAttributeValueImages: Record<string, Record<string, string[]>> = {}
    Object.keys(newConfig).forEach(attrName => {
      newAttributeValueImages[attrName] = {}
      newConfig[attrName].forEach(value => {
        if (attributeValueImages[attrName]?.[value]) {
          newAttributeValueImages[attrName][value] = attributeValueImages[attrName][value]
        } else {
          newAttributeValueImages[attrName][value] = []
        }
      })
    })
    setAttributeValueImages(newAttributeValueImages)
    
    // Clean up colorHex for removed attribute values
    const newAttributeValueColorHex: Record<string, Record<string, string>> = {}
    Object.keys(newConfig).forEach(attrName => {
      newAttributeValueColorHex[attrName] = {}
      newConfig[attrName].forEach(value => {
        if (attributeValueColorHex[attrName]?.[value]) {
          newAttributeValueColorHex[attrName][value] = attributeValueColorHex[attrName][value]
        }
      })
    })
    setAttributeValueColorHex(newAttributeValueColorHex)
    
    // Regenerate variants
    setTimeout(() => {
      const combinations = generateVariantCombinations(newConfig)
      const newVariants: ProductVariant[] = combinations.map((combo) => {
        // Check if variant already exists
        const existingVariant = productVariants.find(v => {
          try {
            if (v.attributes) {
              const attrs = JSON.parse(v.attributes)
              return Object.keys(combo).every(key => attrs[key] === combo[key])
            }
          } catch {
            return false
          }
          return false
        })
        
        // Get images for this variant from attribute values
        const variantImages = getVariantImages(combo)
        
        if (existingVariant) {
          // Update existing variant's images from attribute values
          return {
            ...existingVariant,
            mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
            imageUrl: variantImages.length > 0 ? variantImages[0] : null,
          }
        }
        
        return {
          id: undefined,
          attributes: JSON.stringify(combo),
          color: undefined, // No longer using color
          colorHex: null,
          imageUrl: variantImages.length > 0 ? variantImages[0] : null,
          mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
          priceOverride: null,
          sku: null,
          isActive: true,
        }
      })
      setProductVariants(newVariants)
    }, 100)
  }

  // Add attribute
  const addVariantAttribute = (attrName: string) => {
    if (!attrName.trim()) return
    const trimmed = attrName.trim()
    if (variantConfig[trimmed]) return // Already exists
    
    updateVariantConfig({ ...variantConfig, [trimmed]: [] })
  }

  // Remove attribute
  const removeVariantAttribute = (attrName: string) => {
    const newConfig = { ...variantConfig }
    delete newConfig[attrName]
    updateVariantConfig(newConfig)
    // Remove grouping if it was this attribute
    if (variantGroupBy === attrName) {
      setVariantGroupBy("")
    }
  }

  // Add value to attribute
  const addAttributeValue = (attrName: string, value: string) => {
    if (!value.trim()) return
    const trimmed = value.trim()
    const currentValues = variantConfig[attrName] || []
    if (currentValues.includes(trimmed)) return // Already exists
    
    updateVariantConfig({
      ...variantConfig,
      [attrName]: [...currentValues, trimmed]
    })
  }

  // Remove value from attribute
  const removeAttributeValue = (attrName: string, value: string) => {
    const currentValues = variantConfig[attrName] || []
    updateVariantConfig({
      ...variantConfig,
      [attrName]: currentValues.filter(v => v !== value)
    })
  }

  const addVariant = () => {
    // Create initial attributes object based on configured variant attributes
    let initialAttributes: Record<string, string> = {}
    try {
      if (productForm.variantAttributes) {
        const attributeNames = JSON.parse(productForm.variantAttributes)
        attributeNames.forEach((attr: string) => {
          initialAttributes[attr] = ""
        })
      }
    } catch {
      // If no attributes configured, use legacy color field
      initialAttributes = {}
    }
    
    setProductVariants([...productVariants, { 
      color: "", // Legacy - kept for backward compatibility
      colorHex: "#000000", // Legacy
      attributes: Object.keys(initialAttributes).length > 0 ? JSON.stringify(initialAttributes) : null,
      imageUrl: "", 
      mediaUrls: null, 
      isActive: true 
    }])
  }

  const removeVariant = (index: number) => {
    setProductVariants(productVariants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...productVariants]
    updated[index] = { ...updated[index], [field]: value }
    setProductVariants(updated)
  }

  const handleSaveVariants = async (productId: number) => {
    try {
      const token = sessionStorage.getItem("authToken")
      
      if (!token) {
        alert("Authentication required. Please log in again.")
        return
      }
      
      if (!productId || productId <= 0) {
        alert("Invalid product ID. Please refresh and try again.")
        return
      }
      
      // Regenerate variants with latest images from attribute values before saving
      if (Object.keys(variantConfig).length > 0) {
        console.log("Regenerating variants with attribute value images...")
        generateVariantsFromConfig()
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Get configured variant attributes
      let configuredAttributes: string[] = []
      try {
        if (productForm.variantAttributes) {
          configuredAttributes = JSON.parse(productForm.variantAttributes)
        }
      } catch {
        configuredAttributes = []
      }
      
      // Validate variants before saving
      for (const variant of productVariants) {
        if (configuredAttributes.length > 0) {
          // Validate attributes if configured
          try {
            const attrs = variant.attributes ? JSON.parse(variant.attributes) : {}
            for (const attrName of configuredAttributes) {
              if (!attrs[attrName] || attrs[attrName].trim() === "") {
                alert(`Please enter a value for "${attrName}" for all variants.`)
          return
        }
            }
          } catch {
            alert(`Invalid attributes format for variant. Please check all fields.`)
          return
          }
        }
      }
      
      console.log("Saving variants for product:", productId, "Variants:", productVariants.map(v => {
        let parsedMediaUrls: any = null
        let imageCount = 0
        if (v.mediaUrls) {
          if (typeof v.mediaUrls === 'string') {
            try {
              parsedMediaUrls = JSON.parse(v.mediaUrls)
              imageCount = Array.isArray(parsedMediaUrls) ? parsedMediaUrls.length : 0
            } catch {
              parsedMediaUrls = null
              imageCount = 0
            }
          } else if (v.mediaUrls && typeof v.mediaUrls === 'object' && Array.isArray(v.mediaUrls)) {
            parsedMediaUrls = v.mediaUrls
            imageCount = (v.mediaUrls as string[]).length
          }
        }
        return {
          id: v.id,
          attributes: v.attributes,
          mediaUrls: v.mediaUrls,
          imageUrl: v.imageUrl,
          mediaUrlsType: typeof v.mediaUrls,
          mediaUrlsParsed: parsedMediaUrls,
          imageCount: imageCount
        }
      }))
      
      // Get existing variants from backend (always fetch fresh to avoid deleting newly created ones)
      let existingVariants = []
      try {
        const existingRes = await fetch(`${API_BASE_URL}/api/ProductVariant/product/${productId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        
        if (existingRes.ok) {
          try {
            const data = await existingRes.json()
            existingVariants = Array.isArray(data) ? data : []
          } catch (e) {
            console.log("No existing variants found (empty response), starting fresh")
            existingVariants = []
          }
        } else {
          // If 404 or 401, it might mean no variants exist or auth issue
          if (existingRes.status === 404) {
            console.log("No existing variants found (404), will create new ones")
            existingVariants = []
          } else if (existingRes.status === 401) {
            alert("Authentication failed. Please log in again.")
            return
          } else {
            let errorText = ""
            try {
              errorText = await existingRes.text()
            } catch (e) {
              errorText = "Unable to read error message"
            }
            console.warn("Error fetching existing variants:", {
              status: existingRes.status,
              statusText: existingRes.statusText,
              errorText: errorText || "Empty response"
            })
            // Continue anyway - we'll try to create/update variants
            existingVariants = []
          }
        }
      } catch (error) {
        console.warn("Exception fetching existing variants:", error)
        // Continue anyway - we'll try to create/update variants
        existingVariants = []
      }
      const existingIds = existingVariants.map((v: any) => v.id)
      
      // Create or update variants FIRST (before deletion)
      // This ensures newly created variants get IDs before we check what to delete
      const results = []
      for (const variant of productVariants) {
        if (variant.id && existingIds.includes(variant.id)) {
          // Update existing variant
          // Get images - handle both string (JSON) and array formats
          let variantImages: string[] = []
          try {
            if (variant.mediaUrls) {
              if (typeof variant.mediaUrls === 'string') {
                const parsed = JSON.parse(variant.mediaUrls)
                variantImages = Array.isArray(parsed) ? parsed : []
              } else if (Array.isArray(variant.mediaUrls)) {
                variantImages = variant.mediaUrls
              }
            }
            if (variantImages.length === 0 && variant.imageUrl) {
              variantImages = [variant.imageUrl]
            }
          } catch {
            if (variant.imageUrl) {
              variantImages = [variant.imageUrl]
            }
          }
          
          console.log(`Updating variant ${variant.id} (${variant.attributes}) with ${variantImages.length} images`)
          
          const updateRes = await fetch(`${API_BASE_URL}/api/ProductVariant/${variant.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              color: "", // No longer using color
              colorHex: variant.colorHex || null, // Use variant's colorHex from attributeValueColorHex
              attributes: variant.attributes || null, // Flexible attributes as JSON
              imageUrl: variantImages.length > 0 ? variantImages[0] : variant.imageUrl?.trim() || null,
              mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
              priceOverride: variant.priceOverride || null,
              sku: variant.sku?.trim() || null,
              isActive: variant.isActive,
            }),
          })
          
          if (!updateRes.ok) {
            let errorText = ""
            try {
              errorText = await updateRes.text()
            } catch (e) {
              errorText = "Unable to read error message"
            }
            console.error("Error updating variant:", {
              status: updateRes.status,
              statusText: updateRes.statusText,
              errorText: errorText || "Empty error response",
              variant: variant
            })
            results.push({ 
              success: false, 
              variant: getVariantLabel(variant), 
              error: errorText || `${updateRes.status} ${updateRes.statusText}` 
            })
          } else {
            results.push({ success: true, variant: getVariantLabel(variant) })
          }
        } else if (!variant.id) {
          // Create new variant
          // Get images - handle both string (JSON) and array formats
          let variantImages: string[] = []
          try {
            if (variant.mediaUrls) {
              if (typeof variant.mediaUrls === 'string') {
                const parsed = JSON.parse(variant.mediaUrls)
                variantImages = Array.isArray(parsed) ? parsed : []
              } else if (Array.isArray(variant.mediaUrls)) {
                variantImages = variant.mediaUrls
              }
            }
            if (variantImages.length === 0 && variant.imageUrl) {
              variantImages = [variant.imageUrl]
            }
          } catch {
            if (variant.imageUrl) {
              variantImages = [variant.imageUrl]
            }
          }
          
          console.log(`Creating new variant with ${variantImages.length} images`)
          
          const variantPayload = {
            color: "", // No longer using color
            colorHex: variant.colorHex || null, // Use variant's colorHex from attributeValueColorHex
            attributes: variant.attributes || null, // Flexible attributes as JSON
            imageUrl: variantImages.length > 0 ? variantImages[0] : variant.imageUrl?.trim() || null,
            mediaUrls: variantImages.length > 0 ? JSON.stringify(variantImages) : null,
            priceOverride: variant.priceOverride || null,
            sku: variant.sku?.trim() || null,
            isActive: variant.isActive,
          }
          
          const url = `${API_BASE_URL}/api/ProductVariant?productId=${productId}`
          console.log("Creating variant:", {
            url: url,
            payload: variantPayload,
            productId: productId,
            hasToken: !!token
          })
          
          const createRes = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(variantPayload),
          })
          
          console.log("Create variant response:", {
            status: createRes.status,
            statusText: createRes.statusText,
            ok: createRes.ok,
            headers: Object.fromEntries(createRes.headers.entries())
          })
          
          if (!createRes.ok) {
            let errorText = ""
            let errorJson = null
            try {
              const contentType = createRes.headers.get("content-type")
              if (contentType && contentType.includes("application/json")) {
                errorJson = await createRes.json()
                errorText = errorJson?.message || errorJson?.title || JSON.stringify(errorJson)
              } else {
                errorText = await createRes.text()
              }
            } catch (e) {
              errorText = `Unable to read error message: ${e}`
            }
            
            // 404 could mean endpoint not found or product not found
            if (createRes.status === 404) {
              console.error("404 Not Found - Possible issues:", {
                endpoint: url,
                productId: productId,
                suggestion: "Check if ProductVariantController is registered and product exists",
                fullUrl: url,
                method: "POST"
              })
            }
            
            // 401 means authentication failed
            if (createRes.status === 401) {
              console.error("401 Unauthorized - Authentication failed:", {
                hasToken: !!token,
                tokenLength: token?.length || 0
              })
            }
            
            const errorDetails = {
              status: createRes.status,
              statusText: createRes.statusText,
              errorText: errorText || "Empty error response",
              errorJson: errorJson,
              payload: variantPayload,
              url: url,
              productId: productId,
              headers: {
                contentType: createRes.headers.get("content-type"),
                authorization: createRes.headers.get("www-authenticate")
              }
            }
            
            console.error("Error creating variant:", errorDetails)
            
            results.push({ 
              success: false, 
              variant: getVariantLabel(variant), 
              error: errorText || errorJson?.message || `${createRes.status} ${createRes.statusText}` 
            })
          } else {
            try {
              const newVariant = await createRes.json()
              console.log("Variant created successfully:", newVariant)
              // Update the variant in state with the new ID
              const updatedVariants = productVariants.map(v => 
                v === variant ? { ...v, id: newVariant.id } : v
              )
              setProductVariants(updatedVariants)
              results.push({ success: true, variant: getVariantLabel(variant) })
            } catch (e) {
              console.error("Error parsing response:", e)
              results.push({ success: false, variant: getVariantLabel(variant), error: "Invalid response from server" })
            }
          }
        }
      }
      
      // After creating/updating, refresh variants from backend to get latest IDs
      // This ensures we have the correct state before checking what to delete
      let refreshedVariants = []
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/ProductVariant/product/${productId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          refreshedVariants = Array.isArray(refreshData) ? refreshData : []
        }
      } catch (error) {
        console.warn("Error refreshing variants after save:", error)
        refreshedVariants = existingVariants // Fallback to original list
      }
      
      // Now delete variants that are in the backend but NOT in the current productVariants state
      // Only delete if they're not in the current state (user intentionally removed them)
      for (const existing of refreshedVariants) {
        // Check if this variant exists in the current productVariants state
        // If not, it means the user removed it, so delete it
        const existsInState = productVariants.some(v => {
          // Match by ID if available
          if (v.id && v.id === existing.id) return true
          // Match by attributes if no ID (for newly created variants that just got saved)
          if (!v.id && v.attributes && existing.attributes) {
            try {
              const stateAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
              const existingAttrs = typeof existing.attributes === 'string' ? JSON.parse(existing.attributes) : existing.attributes
              return JSON.stringify(stateAttrs) === JSON.stringify(existingAttrs)
            } catch {
              return v.attributes === existing.attributes
            }
          }
          return false
        })
        
        if (!existsInState) {
          console.log(`Deleting variant ${existing.id} - not found in current state`)
          const deleteRes = await fetch(`${API_BASE_URL}/api/ProductVariant/${existing.id}`, {
            method: "DELETE",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          })
          if (!deleteRes.ok) {
            const errorText = await deleteRes.text()
            console.error("Error deleting variant:", errorText)
          }
        }
      }
      
      // Check if all operations succeeded
      const failed = results.filter(r => !r.success)
      if (failed.length > 0) {
        alert(`Some variants failed to save:\n${failed.map(f => `${f.variant}: ${f.error}`).join('\n')}`)
      } else {
        alert(`All variants saved successfully!`)
      }
      
      // Refresh data to get latest state
      await fetchData()
      
      // Also refresh variants for the current product to update the state
      if (editingProduct) {
        try {
          const variantsRes = await fetch(`${API_BASE_URL}/api/ProductVariant/product/${productId}`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          })
          if (variantsRes.ok) {
            const variantsData = await variantsRes.json()
            const loadedVariants = variantsData.map((v: any) => {
              let variantImages: string[] = []
              try {
                const mediaUrls = v.mediaUrls ? JSON.parse(v.mediaUrls) : []
                variantImages = Array.isArray(mediaUrls) ? mediaUrls : []
                if (variantImages.length === 0 && v.imageUrl) {
                  variantImages = [v.imageUrl]
                }
              } catch {
                variantImages = v.imageUrl ? [v.imageUrl] : []
              }
              return {
                id: v.id,
                attributes: v.attributes,
                color: v.color,
                colorHex: v.colorHex,
                imageUrl: v.imageUrl,
                mediaUrls: variantImages,
                priceOverride: v.priceOverride,
                sku: v.sku,
                isActive: v.isActive,
              }
            })
            setProductVariants(loadedVariants)
          }
        } catch (error) {
          console.error("Error refreshing variants state:", error)
        }
      }
    } catch (error) {
      console.error("Error saving variants:", error)
      alert(`Error saving variants: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600 mb-6">Sign in to access the admin dashboard</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="admin@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            {loginError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {loginError}
              </div>
            )}
            <Button type="submit" className="w-full bg-[#ed6b3e] hover:bg-[#d55a2e]">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Default credentials:</p>
            <p>Email: admin@company.com</p>
            <p>Password: admin123</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your furniture store</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("authToken")
              setIsAuthenticated(false)
              setShowLogin(true)
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          {/* Dashboard - Always visible */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-[#ed6b3e] text-[#ed6b3e]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </button>
          
          {/* Products - Show if user has Products.Read permission OR is SuperAdmin */}
          {(hasPermission("Products", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "products"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Products
            </button>
          )}
          
          {/* Categories - Show if user has Categories.Read permission OR is SuperAdmin */}
          {(hasPermission("Categories", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "categories"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Categories
            </button>
          )}
          
          {/* Inventory - Show if user has Inventory.Read permission OR is SuperAdmin */}
          {(hasPermission("Inventory", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "inventory"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Inventory
            </button>
          )}

          {/* Orders - Show if user has Sales.Read permission OR is SuperAdmin */}
          {(hasPermission("Sales", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "orders"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Orders
            </button>
          )}

          {/* Sales - Show if user has Sales.Read permission OR is SuperAdmin */}
          {(hasPermission("Sales", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "sales"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Sales
            </button>
          )}

          {/* Customers - Show if user has Sales.Read permission OR is SuperAdmin */}
          {(hasPermission("Sales", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "customers"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Customers
            </button>
          )}

          {/* Promo Codes - Show if user has PromoCodes.Read permission OR is SuperAdmin */}
          {(hasPermission("PromoCodes", "Read") || userRoles.includes("SuperAdmin")) && (
            <button
              onClick={() => setActiveTab("promocodes")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "promocodes"
                  ? "border-[#ed6b3e] text-[#ed6b3e]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Promo Codes
            </button>
          )}

          {/* Roles & Permissions - Show for all authenticated users */}
          {isAuthenticated && (
            <Link
              href="/admin/roles"
              className="px-6 py-3 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </Link>
          )}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading dashboard data...</div>
            ) : (
              <>
                {/* Stats Cards - Always show, even if stats is null (will show 0s) */}
                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Products</p>
                          <p className="text-2xl font-bold mt-1">{stats.totalProducts || 0}</p>
                        </div>
                        <Package className="w-8 h-8 text-[#ed6b3e]" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Categories</p>
                          <p className="text-2xl font-bold mt-1">{categories.length}</p>
                        </div>
                        <FolderTree className="w-8 h-8 text-[#ed6b3e]" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold mt-1">
                            LE {salesData?.totalSales?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Low Stock Items</p>
                          <p className="text-2xl font-bold mt-1">{lowStockItems.length}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Products</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                        </div>
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    </Card>
                    <Card className="p-6 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Categories</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                        </div>
                        <FolderTree className="w-8 h-8 text-gray-400" />
                      </div>
                    </Card>
                    <Card className="p-6 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                    </Card>
                    <Card className="p-6 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Low Stock Items</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                      </div>
                    </Card>
                  </div>
                )}

                {/* Low Stock Items List - Show if user has Inventory.Read permission - MOVED TO TOP FOR PROMINENCE */}
                {(hasPermission("Inventory", "Read") || userRoles.includes("SuperAdmin")) && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h2 className="text-2xl font-bold">Low Stock Items</h2>
                        {lowStockItems.length > 0 && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                            {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need attention
                                  </span>
                                )}
                              </div>
                      {lowStockItems.length > 0 && (
                        <span className="text-sm text-gray-500">Sorted by severity</span>
                      )}
                    </div>
                    {lowStockItems.length > 0 ? (
                      <div className="space-y-4">
                        {lowStockItems.map((item, index) => {
                          let variantDisplay = ""
                          try {
                            if (item.variantAttributes) {
                              const attrs = JSON.parse(item.variantAttributes)
                              variantDisplay = Object.entries(attrs).map(([key, value]) => `${key}: ${value}`).join(", ")
                            }
                          } catch {
                            variantDisplay = item.variantAttributes || ""
                          }
                          
                          // Create unique key: use variantId and warehouseId if available, otherwise fallback to id and index
                          const uniqueKey = item.variantId 
                            ? `${item.type}-${item.productId}-${item.variantId}-${item.warehouseId}` 
                            : `${item.type}-${item.id || index}-${item.warehouseId}`
                          
                          return (
                            <Card key={uniqueKey} className={`p-4 transition-shadow hover:shadow-lg ${
                              item.severity === "Critical" ? "border-red-500 bg-red-50" :
                              item.severity === "High" ? "border-orange-500 bg-orange-50" :
                              item.severity === "Medium" ? "border-yellow-500 bg-yellow-50" :
                              "border-blue-500 bg-blue-50"
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="font-bold text-lg">{item.productName}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                      item.severity === "Critical" ? "bg-red-200 text-red-800" :
                                      item.severity === "High" ? "bg-orange-200 text-orange-800" :
                                      item.severity === "Medium" ? "bg-yellow-200 text-yellow-800" :
                                      "bg-blue-200 text-blue-800"
                                    }`}>
                                      {item.severity}
                                    </span>
                                    {item.isNotAvailable && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-red-200 text-red-800 font-semibold">
                                        Not Available
                                      </span>
                                    )}
                                    {item.isOutOfStock && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-red-300 text-red-900 font-semibold">
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-700 space-y-1">
                                    <p>
                                      <span className="font-medium">Type:</span> {item.type}
                                      {item.variantId && variantDisplay && (
                                        <span className="ml-2">
                                          • <span className="font-medium">Variant:</span> {variantDisplay}
                                        </span>
                                      )}
                                    </p>
                                    <p className={item.quantity === 0 ? "font-bold text-red-700" : ""}>
                                      <span className="font-medium">Current Stock:</span> {item.quantity} {item.unit || "pieces"}
                                    </p>
                                    {item.minimumStockLevel !== null && (
                                      <p>
                                        <span className="font-medium">Minimum Level:</span> {item.minimumStockLevel} {item.unit || "pieces"}
                                      </p>
                                    )}
                                    {item.productSKU && (
                                      <p>
                                        <span className="font-medium">SKU:</span> {item.productSKU}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveTab("inventory")
                                  }}
                                  className="ml-4"
                                >
                                  Manage Stock
                                </Button>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Card className="p-6 text-center text-gray-500 bg-green-50 border-green-200">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                        <p className="font-medium">No low stock items found. All inventory levels are healthy!</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Categories Overview - Matching Frontend */}
                {/* Show categories if user has permission OR is SuperAdmin/Admin, and categories exist */}
                {(hasPermission("Categories", "Read") || userRoles.includes("SuperAdmin") || userRoles.includes("Admin")) && categories.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">Collections Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categories.map((category) => {
                      // Match frontend category names and descriptions
                      const categoryInfo: Record<string, { description: string; badge?: string }> = {
                        "SEATING": { description: "Be comfortable. Seat at home!" },
                        "SOFAS": { description: "Create the perfect lounge area!" },
                        "ROOMS": { description: "Complete room solutions for modern living!" },
                        "TABLES": { description: "Surfaces that define your space!" },
                        "HOME DECORS": { description: "Touches that add character!" },
                        "NEW ARRIVALS": { description: "Fresh designs for modern spaces!", badge: "New" },
                        "BEST SELLING": { description: "Customer favorites and top picks!", badge: "Popular" },
                      }
                      
                      const info = categoryInfo[category.name] || { description: category.description || "" }
                      
                      return (
                        <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold">{category.name}</h3>
                                {info.badge && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    info.badge === "New" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                  }`}>
                                    {info.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-500">{category.productCount} Products</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveTab("products")
                                // You could filter products by category here
                              }}
                            >
                              View Products
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Products</h2>
              <Button onClick={() => openProductModal()} className="bg-[#ed6b3e] hover:bg-[#d55a2e]">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <>
                {/* Group products by category matching frontend structure */}
                {["SEATING", "SOFAS", "ROOMS", "TABLES", "HOME DECORS", "NEW ARRIVALS", "BEST SELLING"].map((categoryName) => {
                  const categoryProducts = products.filter(p => p.categoryName === categoryName && p.isActive)
                  if (categoryProducts.length === 0) return null
                  
                  return (
                    <div key={categoryName} className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">{categoryName}</h3>
                        <span className="text-sm text-gray-500">{categoryProducts.length} products</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryProducts.map((product) => {
                          // Get selected variant for this product
                          const selectedVariant = selectedVariants[product.id]
                          
                          // Calculate stock:
                          // - If a variant is selected and product has variants, show that variant's stock
                          // - Otherwise, show total quantity (sum of all variants or product inventory)
                          let stock = product.totalQuantity || 0
                          if (selectedVariant && selectedVariant.id && product.variants && product.variants.length > 0) {
                            // Try to get variant inventory from variantInventories state
                            const productVariantInventories = variantInventories[product.id] || []
                            const variantInventory = productVariantInventories.find(vi => vi.variantId === selectedVariant.id)
                            if (variantInventory) {
                              stock = variantInventory.quantity
                            } else {
                              // Variant inventory not loaded yet, show total as fallback
                              stock = product.totalQuantity || 0
                            }
                          }
                          
                          // Parse mediaUrls to get all images for this product
                          let productImageUrls: string[] = []
                          try {
                            if (product.mediaUrls) {
                              const parsed = JSON.parse(product.mediaUrls)
                              productImageUrls = Array.isArray(parsed) ? parsed : []
                            }
                            // Fallback to imageUrl if no mediaUrls
                            if (productImageUrls.length === 0 && product.imageUrl) {
                              productImageUrls = [product.imageUrl]
                            }
                          } catch {
                            // If parsing fails, use imageUrl as fallback
                            if (product.imageUrl) {
                              productImageUrls = [product.imageUrl]
                            }
                          }
                          
                          // Collect all variant images and merge with product images (deduplicate)
                          const allVariantImages: Array<{ imageUrl: string; variantId: number; variantName: string }> = []
                          const seenImageUrls = new Set<string>(productImageUrls) // Track unique images
                          
                          if (product.variants && product.variants.length > 0) {
                            product.variants.filter((v: any) => v.isActive).forEach((variant: any) => {
                              let variantImageUrls: string[] = []
                              try {
                                if (variant.mediaUrls) {
                                  const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
                                  variantImageUrls = Array.isArray(parsed) ? parsed : []
                                }
                                // Fallback to imageUrl if no mediaUrls
                                if (variantImageUrls.length === 0 && variant.imageUrl) {
                                  variantImageUrls = [variant.imageUrl]
                                }
                              } catch {
                                if (variant.imageUrl) {
                                  variantImageUrls = [variant.imageUrl]
                                }
                              }
                              
                              // Add variant images to the collection (only if not already seen)
                              variantImageUrls.forEach(imgUrl => {
                                if (!seenImageUrls.has(imgUrl)) {
                                  seenImageUrls.add(imgUrl)
                                  allVariantImages.push({
                                    imageUrl: imgUrl,
                                    variantId: variant.id || 0,
                                    variantName: variant.color || "Color"
                                  })
                                }
                              })
                            })
                          }
                          
                          // Combine product images and unique variant images
                          const allImageUrls = [...productImageUrls, ...allVariantImages.map(v => v.imageUrl)]
                          
                          const currentImageIndex = productCardImageIndex[product.id] || 0
                          
                          return (
                          <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                            {allImageUrls.length > 0 && (
                              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden group">
                                {/* Image Carousel */}
                                <div className="relative w-full h-full">
                                  {allImageUrls.map((imgUrl, imgIndex) => (
                                    <img
                                      key={imgIndex}
                                      src={imgUrl}
                                      alt={`${product.name} - Image ${imgIndex + 1}`}
                                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                        imgIndex === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                      }`}
                                      crossOrigin="anonymous"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (target.src !== "https://via.placeholder.com/150?text=Invalid+URL") {
                                          target.src = "https://via.placeholder.com/150?text=Invalid+URL"
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                                
                                {/* Carousel Navigation - Only show if more than 1 image */}
                                {allImageUrls.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const newIndex = (currentImageIndex - 1 + allImageUrls.length) % allImageUrls.length
                                        setProductCardImageIndex({
                                          ...productCardImageIndex,
                                          [product.id]: newIndex
                                        })
                                      }}
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const newIndex = (currentImageIndex + 1) % allImageUrls.length
                                        setProductCardImageIndex({
                                          ...productCardImageIndex,
                                          [product.id]: newIndex
                                        })
                                      }}
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Image Indicators */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                      {allImageUrls.map((_, idx) => (
                                        <div
                                          key={idx}
                                          className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                                            idx === currentImageIndex 
                                              ? 'bg-white opacity-100' 
                                              : 'bg-white opacity-50'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    
                                    {/* Image Counter */}
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
                                      {currentImageIndex + 1} / {allImageUrls.length}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{product.categoryName}</p>
                            <p className="text-lg font-bold text-[#ed6b3e] mb-2">
                              LE {(() => {
                                const selectedVariant = selectedVariants[product.id]
                                const displayPrice = selectedVariant?.priceOverride ?? product.price
                                return displayPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              })()}
                            </p>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm text-gray-500">
                                  Stock: {stock} piece{stock !== 1 ? 's' : ''}
                                </p>
                                {product.alwaysAvailable ? (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Always Available</span>
                                ) : stock <= 0 ? (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Out of Stock</span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">In Stock</span>
                                )}
                              </div>
                            {product.sku && (
                              <p className="text-xs text-gray-400 mb-4">SKU: {product.sku}</p>
                            )}
                            <div className="flex space-x-2 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProductModal(product)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {product.variants && product.variants.length > 0 ? (
                              <VariantSelector 
                                product={product} 
                                allImageUrls={allImageUrls}
                                productCardImageIndex={productCardImageIndex}
                                setProductCardImageIndex={setProductCardImageIndex}
                                selectedVariant={selectedVariants[product.id] || null}
                                setSelectedVariant={(variant) => {
                                  setSelectedVariants({
                                    ...selectedVariants,
                                    [product.id]: variant
                                  })
                                }}
                              />
                            ) : (
                              <div className="pt-4 border-t border-gray-200 text-center">
                                <p className="text-xs text-gray-400">No variants</p>
                              </div>
                            )}
                          </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                {/* Show products that don't match any frontend category */}
                {products.filter(p => p.isActive && !["SEATING", "SOFAS", "ROOMS", "TABLES", "HOME DECORS", "NEW ARRIVALS", "BEST SELLING"].includes(p.categoryName)).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Other Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products
                        .filter(p => p.isActive && !["SEATING", "SOFAS", "ROOMS", "TABLES", "HOME DECORS", "NEW ARRIVALS", "BEST SELLING"].includes(p.categoryName))
                        .map((product) => {
                          // Get selected variant for this product
                          const selectedVariant = selectedVariants[product.id]
                          
                          // Calculate stock:
                          // - If a variant is selected and product has variants, show that variant's stock
                          // - Otherwise, show total quantity (sum of all variants or product inventory)
                          let stock = product.totalQuantity || 0
                          if (selectedVariant && selectedVariant.id && product.variants && product.variants.length > 0) {
                            // Try to get variant inventory from variantInventories state
                            const productVariantInventories = variantInventories[product.id] || []
                            const variantInventory = productVariantInventories.find(vi => vi.variantId === selectedVariant.id)
                            
                            if (variantInventory) {
                              stock = variantInventory.quantity
                            } else {
                              // Variant inventory not loaded yet, show total as fallback
                              stock = product.totalQuantity || 0
                            }
                          }
                          
                          // Parse mediaUrls for carousel
                          let productImages: string[] = []
                          try {
                            if (product.mediaUrls) {
                              const parsed = JSON.parse(product.mediaUrls)
                              productImages = Array.isArray(parsed) ? parsed : []
                            }
                            // Fallback to imageUrl if no mediaUrls
                            if (productImages.length === 0 && product.imageUrl) {
                              productImages = [product.imageUrl]
                            }
                          } catch {
                            if (product.imageUrl) {
                              productImages = [product.imageUrl]
                            }
                          }
                          
                          // Collect all variant images and merge with product images (deduplicate)
                          const allVariantImagesForOther: Array<{ imageUrl: string; variantId: number; variantName: string }> = []
                          const seenImageUrlsForOther = new Set<string>(productImages) // Track unique images
                          
                          if (product.variants && product.variants.length > 0) {
                            product.variants.filter((v: any) => v.isActive).forEach((variant: any) => {
                              let variantImageUrls: string[] = []
                              try {
                                if (variant.mediaUrls) {
                                  const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
                                  variantImageUrls = Array.isArray(parsed) ? parsed : []
                                }
                                if (variantImageUrls.length === 0 && variant.imageUrl) {
                                  variantImageUrls = [variant.imageUrl]
                                }
                              } catch {
                                if (variant.imageUrl) {
                                  variantImageUrls = [variant.imageUrl]
                                }
                              }
                              // Add variant images to the collection (only if not already seen)
                              variantImageUrls.forEach(imgUrl => {
                                if (!seenImageUrlsForOther.has(imgUrl)) {
                                  seenImageUrlsForOther.add(imgUrl)
                                  allVariantImagesForOther.push({
                                    imageUrl: imgUrl,
                                    variantId: variant.id || 0,
                                    variantName: variant.color || "Color"
                                  })
                                }
                              })
                            })
                          }
                          
                          // Combine product images and unique variant images
                          const allImagesForOther = [...productImages, ...allVariantImagesForOther.map(v => v.imageUrl)]
                          
                          return (
                          <Card key={product.id} className="p-6">
                              {allImagesForOther.length > 0 && (
                                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden group">
                                  {/* Image Carousel */}
                                  <div className="relative w-full h-full">
                                    {allImagesForOther.map((imgUrl, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={imgUrl}
                                        alt={`${product.name} - Image ${imgIndex + 1}`}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                          imgIndex === (productCardImageIndex[product.id] || 0) ? 'opacity-100' : 'opacity-0'
                                        }`}
                                        crossOrigin="anonymous"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          // Use a data URI for placeholder to avoid network requests
                                          const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E"
                                          if (target.src !== placeholder) {
                                            target.src = placeholder
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                  
                                  {/* Carousel Navigation */}
                                  {allImagesForOther.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const currentIdx = productCardImageIndex[product.id] || 0
                                          setProductCardImageIndex({
                                            ...productCardImageIndex,
                                            [product.id]: (currentIdx - 1 + allImagesForOther.length) % allImagesForOther.length
                                          })
                                        }}
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-70"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const currentIdx = productCardImageIndex[product.id] || 0
                                          setProductCardImageIndex({
                                            ...productCardImageIndex,
                                            [product.id]: (currentIdx + 1) % allImagesForOther.length
                                          })
                                        }}
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                      
                                      {/* Image Indicators */}
                                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                        {allImagesForOther.map((_, idx) => (
                                          <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                                              idx === (productCardImageIndex[product.id] || 0) 
                                                ? 'bg-white opacity-100' 
                                                : 'bg-white opacity-50'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      
                                      {/* Image Counter */}
                                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
                                        {(productCardImageIndex[product.id] || 0) + 1} / {allImagesForOther.length}
                                      </div>
                                    </>
                                  )}
                                </div>
                            )}
                            <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{product.categoryName}</p>
                            <p className="text-lg font-bold text-[#ed6b3e] mb-2">
                              LE {product.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                              <div className="flex items-center gap-2 mb-4">
                                <p className="text-sm text-gray-500">
                                  Stock: {stock} piece{stock !== 1 ? 's' : ''}
                                </p>
                                {product.alwaysAvailable ? (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Always Available</span>
                                ) : stock <= 0 ? (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Out of Stock</span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">In Stock</span>
                                )}
                              </div>
                            <div className="flex space-x-2 mb-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProductModal(product)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {product.variants && product.variants.length > 0 && (
                              <div className="pt-4 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2 items-center justify-center">
                                  {product.variants.filter((v: any) => v.isActive).map((variant: any, idx: number) => {
                                    // Use the exact colorHex value from the variant (the hex color selected from palette)
                                    const displayColor = variant.colorHex || "#cccccc"
                                    // Ensure it's a valid hex color format (starts with #)
                                    const finalColor = displayColor && displayColor.trim() !== "" 
                                      ? (displayColor.startsWith("#") ? displayColor : `#${displayColor}`)
                                      : "#cccccc"
                                    
                                    // Get variant images
                                    let variantImageUrls: string[] = []
                                    try {
                                      if (variant.mediaUrls) {
                                        const parsed = typeof variant.mediaUrls === 'string' ? JSON.parse(variant.mediaUrls) : variant.mediaUrls
                                        variantImageUrls = Array.isArray(parsed) ? parsed : []
                                      }
                                      // Fallback to imageUrl if no mediaUrls
                                      if (variantImageUrls.length === 0 && variant.imageUrl) {
                                        variantImageUrls = [variant.imageUrl]
                                      }
                                    } catch {
                                      if (variant.imageUrl) {
                                        variantImageUrls = [variant.imageUrl]
                                      }
                                    }
                                    
                                    // Find the index of the first variant image in the combined carousel
                                    const findVariantImageIndex = () => {
                                      if (variantImageUrls.length === 0) return -1
                                      const firstVariantImage = variantImageUrls[0]
                                      // Find where this variant's first image appears in the combined carousel
                                      return allImagesForOther.findIndex(img => img === firstVariantImage)
                                    }
                                    
                                    return (
                                      <div
                                        key={variant.id || idx}
                                        className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer hover:scale-110 transition-transform relative"
                                        style={{ backgroundColor: finalColor }}
                                        title={`${variant.color || "Color"} (${finalColor}) - Click to view images`}
                                        onClick={() => {
                                          const variantImageIndex = findVariantImageIndex()
                                          if (variantImageIndex >= 0) {
                                            // Navigate to the variant's first image in the carousel
                                            setProductCardImageIndex({
                                              ...productCardImageIndex,
                                              [product.id]: variantImageIndex
                                            })
                                          }
                                        }}
                                      >
                                        {variantImageUrls.length > 0 && (
                                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                                            {variantImageUrls.length}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </Card>
                          )
                        })}
                      </div>
                    </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {/* Inventory Tab - Only show if user has permission */}
        {activeTab === "inventory" && (hasPermission("Inventory", "Read") || userRoles.includes("SuperAdmin")) && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <label htmlFor="inventory-category-filter" className="text-sm font-medium text-gray-700">
                  Filter by Category:
                </label>
                <select
                  id="inventory-category-filter"
                  value={selectedInventoryCategory}
                  onChange={(e) => setSelectedInventoryCategory(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-gill-sans focus:outline-none focus:ring-2 focus:ring-[#ed6b3e] focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories
                    .filter((c) => c.isActive)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const filteredProducts = products.filter((p) => {
                    // Filter by active status
                    if (!p.isActive) return false
                    
                    // Filter by category if selected
                    if (selectedInventoryCategory !== "all") {
                      // Check primary category
                      if (p.categoryId === selectedInventoryCategory) return true
                      // Check if product is in any of its categories
                      if (p.categoryIds && p.categoryIds.includes(selectedInventoryCategory)) return true
                      // Check category name as fallback
                      if (p.categoryName && categories.find(c => c.id === selectedInventoryCategory)?.name === p.categoryName) return true
                      return false
                    }
                    
                    return true
                  })
                  
                  return (
                    <>
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-600 font-gill-sans">
                            {selectedInventoryCategory !== "all" 
                              ? "No products found in the selected category."
                              : "No active products found."}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-600 font-gill-sans mb-4">
                            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                            {selectedInventoryCategory !== "all" && (
                              <span> in category: <strong>{categories.find(c => c.id === selectedInventoryCategory)?.name}</strong></span>
                            )}
                          </div>
                          {filteredProducts.map((product) => {
                    const totalStock = product.totalQuantity || 0
                    interface InventoryItem {
                      warehouseName?: string
                      quantity?: number
                      warehouseId?: number
                    }
                    const inventories: InventoryItem[] = (product as Product & { inventories?: InventoryItem[] }).inventories || []
                    // Get online store inventory (or first inventory if only one exists)
                    const onlineInventory = inventories.find((inv: InventoryItem) => 
                      inv.warehouseName?.toLowerCase().includes("online") || 
                      inv.warehouseName?.toLowerCase().includes("store")
                    ) || inventories[0]
                    
                    const currentStock = onlineInventory?.quantity || totalStock || 0
                    const isEditing = editingInventory?.productId === product.id && !editingInventory?.variantId
                    const productVariants = product.variants?.filter((v: any) => v.isActive) || []
                    const hasVariants = productVariants.length > 0
                    const productVariantInventories = variantInventories[product.id] || []
                    
                    // Helper to get variant label
                    const getVariantLabel = (variant: any): string => {
                      try {
                        if (variant.attributes) {
                          const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes
                          if (typeof attrs === 'object' && attrs !== null) {
                            return Object.entries(attrs).map(([key, value]) => `${key}: ${value}`).join(", ")
                          }
                        }
                      } catch {
                        // Fallback
                      }
                      return variant.color || `Variant ${variant.id}`
                    }
                    
                    return (
                      <Card key={product.id} className="p-6">
                        <div className="flex items-start gap-6">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                <p className="text-sm text-gray-600 mb-3">{product.categoryName || "Uncategorized"}</p>
                                
                                {!hasVariants ? (
                                  // Product without variants - show product-level inventory
                                  isEditing ? (
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Stock Quantity</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={editingInventory?.quantity ?? currentStock}
                                          onChange={(e) => {
                                            if (editingInventory) {
                                              const value = e.target.value
                                              // Allow empty string for clearing, otherwise parse as number
                                              setEditingInventory({
                                                ...editingInventory,
                                                quantity: value === "" ? "" : (parseFloat(value) || 0),
                                              })
                                            }
                                          }}
                                          onBlur={(e) => {
                                            // Convert empty string to 0 when field loses focus
                                            if (editingInventory && e.target.value === "") {
                                              setEditingInventory({
                                                ...editingInventory,
                                                quantity: 0,
                                              })
                                            }
                                          }}
                                          className="w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <div className="flex items-end gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            if (editingInventory) {
                                              handleUpdateOnlineStock(
                                                product.id,
                                                typeof editingInventory.quantity === 'string' ? parseFloat(editingInventory.quantity) || 0 : editingInventory.quantity
                                              )
                                            }
                                          }}
                                          className="bg-[#ed6b3e] hover:bg-[#d55a2e] text-white"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingInventory(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                                        <p className="text-2xl font-bold text-[#ed6b3e]">
                                          {currentStock} <span className="text-base font-normal text-gray-600">piece{currentStock !== 1 ? 's' : ''}</span>
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setEditingInventory({
                                            productId: product.id,
                                            quantity: currentStock,
                                          })
                                        }
                                        className="mt-4"
                                      >
                                        Update Stock
                                      </Button>
                                    </div>
                                  )
                                ) : (
                                  // Product with variants - show variant-level inventory
                                  <div className="space-y-4">
                                    <div className="text-sm text-gray-600 mb-2">Variants Inventory:</div>
                                    {productVariants.length === 0 ? (
                                      <p className="text-sm text-gray-500">No active variants for this product.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {productVariants.map((variant: any) => {
                                          // Find inventory for this variant, or default to 0 if not found
                                          const variantInventory = productVariantInventories.find(vi => vi.variantId === variant.id)
                                          const variantStock = variantInventory?.quantity ?? 0
                                          const isVariantEditing = editingInventory?.productId === product.id && editingInventory?.variantId === variant.id
                                        
                                        return (
                                          <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="font-medium text-sm mb-2 text-gray-800">{getVariantLabel(variant)}</p>
                                                {isVariantEditing ? (
                                                  <div className="flex flex-col gap-3 mt-2">
                                                    <div>
                                                      <label className="text-xs font-medium text-gray-700 mb-1 block">Set Stock Quantity</label>
                                                      <input
                                                        id={`variant-stock-${variant.id}`}
                                                        name={`variant-stock-${variant.id}`}
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={editingInventory?.quantity ?? variantStock}
                                                        onChange={(e) => {
                                                          if (editingInventory) {
                                                            const value = e.target.value
                                                            // Allow empty string for clearing, otherwise parse as number
                                                            setEditingInventory({
                                                              ...editingInventory,
                                                              quantity: value === "" ? "" : (parseFloat(value) || 0),
                                                            })
                                                          }
                                                        }}
                                                        onBlur={(e) => {
                                                          // Convert empty string to 0 when field loses focus
                                                          if (editingInventory && e.target.value === "") {
                                                            setEditingInventory({
                                                              ...editingInventory,
                                                              quantity: 0,
                                                            })
                                                          }
                                                        }}
                                                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#ed6b3e]"
                                                        autoComplete="off"
                                                      />
                                                      <p className="text-xs text-gray-500 mt-1">Enter the stock quantity for this variant</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                          if (editingInventory && variant.id) {
                                                            try {
                                                              await handleUpdateOnlineStock(
                                                                product.id,
                                                                typeof editingInventory.quantity === 'string' ? parseFloat(editingInventory.quantity) || 0 : editingInventory.quantity,
                                                                variant.id
                                                              )
                                                              // Success feedback
                                                              console.log(`Stock updated for variant ${variant.id}: ${editingInventory.quantity}`)
                                                            } catch (error) {
                                                              console.error("Error updating variant stock:", error)
                                                            }
                                                          }
                                                        }}
                                                        className="bg-[#ed6b3e] hover:bg-[#d55a2e] text-white"
                                                      >
                                                        Save Stock
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingInventory(null)}
                                                      >
                                                        Cancel
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center justify-between mt-2">
                                                    <div>
                                                      <p className="text-xs text-gray-600 mb-1">Current Stock</p>
                                                      <p className="text-lg font-bold text-[#ed6b3e]">
                                                        {variantStock} <span className="text-sm font-normal text-gray-600">piece{variantStock !== 1 ? 's' : ''}</span>
                                                      </p>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        if (variant.id) {
                                                          setEditingInventory({
                                                            productId: product.id,
                                                            variantId: variant.id,
                                                            quantity: variantStock,
                                                          })
                                                        }
                                                      }}
                                                      className="ml-4"
                                                    >
                                                      Set Stock
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                        </>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Categories</h2>
              <Button onClick={() => openCategoryModal()} className="bg-[#ed6b3e] hover:bg-[#d55a2e]">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories
                  .sort((a, b) => {
                    // Sort to match frontend order
                    const order = ["SEATING", "SOFAS", "ROOMS", "TABLES", "HOME DECORS", "NEW ARRIVALS", "BEST SELLING"]
                    const aIndex = order.indexOf(a.name)
                    const bIndex = order.indexOf(b.name)
                    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
                    if (aIndex === -1) return 1
                    if (bIndex === -1) return -1
                    return aIndex - bIndex
                  })
                  .map((category) => {
                    // Match frontend category descriptions
                    const categoryInfo: Record<string, { description: string; badge?: string }> = {
                      "SEATING": { description: "Be comfortable. Seat at home!" },
                      "SOFAS": { description: "Create the perfect lounge area!" },
                      "ROOMS": { description: "Complete room solutions for modern living!" },
                      "TABLES": { description: "Surfaces that define your space!" },
                      "HOME DECORS": { description: "Touches that add character!" },
                      "NEW ARRIVALS": { description: "Fresh designs for modern spaces!", badge: "New" },
                      "BEST SELLING": { description: "Customer favorites and top picks!", badge: "Popular" },
                    }
                    
                    const info = categoryInfo[category.name] || { description: category.description || "No description" }
                    
                    return (
                      <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{category.name}</h3>
                              {info.badge && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  info.badge === "New" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                  {info.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{info.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500">Products: {category.productCount}</p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCategoryModal(category)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Name</Label>
                <Input
                  id="categoryName"
                  name="categoryName"
                  type="text"
                  autoComplete="off"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  name="categoryDescription"
                  autoComplete="off"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Category description"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className="flex-1 bg-[#ed6b3e] hover:bg-[#d55a2e]"
                >
                  {editingCategory ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? "Edit Product" : "Create Product"}
              </h2>
              <button onClick={() => setShowProductModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  autoComplete="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  name="productDescription"
                  autoComplete="off"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productPrice">Price</Label>
                  <Input
                    id="productPrice"
                    name="productPrice"
                    type="number"
                    autoComplete="off"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="productCategories">Categories (Select multiple)</Label>
                  <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories available</p>
                    ) : (
                      categories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`category-${cat.id}`}
                            name="productCategories"
                            checked={productForm.categoryIds.includes(cat.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProductForm({
                                  ...productForm,
                                  categoryIds: [...productForm.categoryIds, cat.id],
                                  categoryId: productForm.categoryIds.length === 0 ? cat.id.toString() : productForm.categoryId // Set first as primary
                                })
                              } else {
                                const newCategoryIds = productForm.categoryIds.filter(id => id !== cat.id)
                                setProductForm({
                                  ...productForm,
                                  categoryIds: newCategoryIds,
                                  categoryId: newCategoryIds.length > 0 ? newCategoryIds[0].toString() : ""
                                })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {productForm.categoryIds.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {productForm.categoryIds.length} categor{productForm.categoryIds.length === 1 ? 'y' : 'ies'} selected
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productSKU">SKU</Label>
                  <Input
                    id="productSKU"
                    name="productSKU"
                    autoComplete="off"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="SKU"
                  />
                </div>
                <div>
                  <Label htmlFor="productBrand">Brand</Label>
                  <Input
                    id="productBrand"
                    name="productBrand"
                    autoComplete="organization"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="Brand"
                  />
                </div>
              </div>
              
              {/* Multiple Images */}
              <div>
                <Label>Product Images (You can add multiple images)</Label>
                <p className="text-xs text-gray-500 mb-2">Upload images from your computer or add image URLs</p>
                {productImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-2 mb-2">
                    {productImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.src !== "https://via.placeholder.com/150?text=Invalid+URL") {
                              target.src = "https://via.placeholder.com/150?text=Invalid+URL"
                            }
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProductImages((prevImages) => {
                              const newImages = prevImages.filter((_, i) => i !== index)
                              setProductForm((prevForm) => ({ 
                                ...prevForm, 
                                mediaUrls: JSON.stringify(newImages) 
                              }))
                              return newImages
                            })
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      id="product-image-upload"
                      name="product-image-upload"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        const imageFiles = files.filter(file => file.type.startsWith("image/"))
                        
                        if (imageFiles.length === 0) {
                          alert("Please select image files only")
                          e.target.value = ""
                          return
                        }
                        
                        // Process all files and collect base64 URLs
                        const newImageUrls: string[] = []
                        
                        for (const file of imageFiles) {
                          try {
                            const base64Url = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const result = event.target?.result as string
                                if (result) {
                                  resolve(result)
                                } else {
                                  reject(new Error("Failed to read file"))
                                }
                              }
                              reader.onerror = () => reject(new Error("File read error"))
                              reader.readAsDataURL(file)
                            })
                            newImageUrls.push(base64Url)
                          } catch (error) {
                            console.error("Error reading file:", file.name, error)
                            alert(`Failed to read file: ${file.name}`)
                          }
                        }
                        
                        // Update state with all new images at once
                        if (newImageUrls.length > 0) {
                          setProductImages((prevImages) => {
                            const updatedImages = [...prevImages, ...newImageUrls]
                            setProductForm((prevForm) => ({ 
                              ...prevForm, 
                              mediaUrls: JSON.stringify(updatedImages) 
                            }))
                            return updatedImages
                          })
                        }
                        
                        // Reset input
                        e.target.value = ""
                      }}
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload images from your computer</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                    </label>
                  </div>
                  
                  {/* URL Input */}
                  <div className="flex gap-2">
                    <Label htmlFor="product-image-input" className="sr-only">Product Image URL</Label>
                <Input
                      id="product-image-input"
                      name="product-image-input"
                      type="url"
                      autoComplete="url"
                      placeholder="Or enter image URL and press Enter or click +"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          if (input.value.trim()) {
                            const imageUrl = input.value.trim()
                            setProductImages((prevImages) => {
                              const updatedImages = [...prevImages, imageUrl]
                              setProductForm((prevForm) => ({ 
                                ...prevForm, 
                                mediaUrls: JSON.stringify(updatedImages) 
                              }))
                              return updatedImages
                            })
                            input.value = ""
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                    onClick={() => {
                      const input = document.getElementById("product-image-input") as HTMLInputElement
                      if (input && input.value.trim()) {
                        const imageUrl = input.value.trim()
                        setProductImages((prevImages) => {
                          const updatedImages = [...prevImages, imageUrl]
                          setProductForm((prevForm) => ({ 
                            ...prevForm, 
                            mediaUrls: JSON.stringify(updatedImages) 
                          }))
                          return updatedImages
                        })
                        input.value = ""
                      }
                    }}
                      title="Add image URL"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {productImages.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {productImages.length} image{productImages.length !== 1 ? 's' : ''} added
                  </p>
                )}
              </div>

              {/* Variant Attributes Configuration Section */}
              <div className="border-t border-gray-200 pt-4">
                <Label className="text-lg font-semibold mb-2 block">Variant Definitions</Label>
                <p className="text-xs text-gray-500 mb-3">Add attributes and their values. All combinations will be automatically generated.</p>
                
                {/* Add New Attribute */}
                <div className="flex gap-2 mb-4">
                  <Input
                    id="new-attribute-name"
                    name="new-attribute-name"
                    type="text"
                    autoComplete="off"
                    placeholder="Attribute name (e.g., Color, Size, Parts)"
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        if (input.value.trim()) {
                          addVariantAttribute(input.value.trim())
                          input.value = ""
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("new-attribute-name") as HTMLInputElement
                      if (input && input.value.trim()) {
                        addVariantAttribute(input.value.trim())
                        input.value = ""
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Select which attribute to use for images */}
                {Object.keys(variantConfig).length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Image Attribute</Label>
                    <p className="text-xs text-gray-600 mb-2">Select which attribute&apos;s values will have images. All variants with the same value will share the same images.</p>
                    <select
                      id="image-attribute-select"
                      name="image-attribute-select"
                      value={imageAttribute}
                      onChange={(e) => {
                        setImageAttribute(e.target.value)
                        // Clear images from other attributes when switching
                        if (e.target.value) {
                          const newImages: Record<string, Record<string, string[]>> = {}
                          newImages[e.target.value] = attributeValueImages[e.target.value] || {}
                          setAttributeValueImages(newImages)
                        } else {
                          setAttributeValueImages({})
                        }
                        // Regenerate variants
                        setTimeout(() => generateVariantsFromConfig(), 100)
                      }}
                      className="text-sm border border-gray-300 rounded px-3 py-2 w-full"
                    >
                      <option value="">None (no images per variant)</option>
                      {Object.keys(variantConfig).map(attr => (
                        <option key={attr} value={attr}>{attr}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Display Attributes with Values */}
                <div className="space-y-4">
                  {Object.keys(variantConfig).map((attrName) => {
                    const isImageAttribute = imageAttribute === attrName
                    
                    return (
                    <div key={attrName} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <Label className="font-medium">{attrName}</Label>
                          {isImageAttribute && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Images</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isImageAttribute) {
                              setImageAttribute("")
                              setAttributeValueImages({})
                            }
                            removeVariantAttribute(attrName)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Attribute Values with Image Galleries (only for image attribute) */}
                      <div className="space-y-3 mb-2">
                        {variantConfig[attrName].map((value, idx) => {
                          // Only show image galleries for the selected image attribute
                          const valueImages = isImageAttribute ? (attributeValueImages[attrName]?.[value] || []) : []
                          
                          // Check if this is a Color attribute
                          const isColorAttribute = attrName.toLowerCase() === "color"
                          // Get colorHex, ensuring it's a valid hex color string
                          const rawColorHex = isColorAttribute ? attributeValueColorHex[attrName]?.[value] : null
                          const colorHex = isColorAttribute 
                            ? (rawColorHex && rawColorHex.trim() !== "" 
                                ? (rawColorHex.startsWith("#") ? rawColorHex : `#${rawColorHex}`)
                                : "#cccccc")
                            : null
                          
                          return (
                            <div key={`${attrName}-${value}`} className={`border border-gray-200 rounded p-2 ${isImageAttribute ? 'bg-gray-50' : ''}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  {/* Color Display with Background */}
                                  {isColorAttribute && colorHex ? (
                                    <div 
                                      className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                                      style={{ backgroundColor: colorHex }}
                                    />
                                  ) : null}
                                  <span 
                                    className="text-sm font-medium px-2 py-1 rounded"
                                    style={isColorAttribute && colorHex ? {
                                      backgroundColor: colorHex,
                                      color: getContrastColor(colorHex),
                                      border: `1px solid ${colorHex}`
                                    } : {}}
                                  >
                                    {value}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Color Picker for Color Attribute */}
                                  {isColorAttribute && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        key={`color-picker-${attrName}-${value}`}
                                        type="color"
                                        value={colorHex || "#cccccc"}
                                        onChange={(e) => {
                                          const newHex = e.target.value
                                          console.log(`Updating color for ${attrName}:${value} to ${newHex}`)
                                          
                                          // Update state and regenerate variants with the new colorHex immediately
                                          setAttributeValueColorHex(prev => {
                                            const updated = {
                                              ...prev,
                                              [attrName]: {
                                                ...(prev[attrName] || {}),
                                                [value]: newHex
                                              }
                                            }
                                            console.log('Updated attributeValueColorHex:', updated)
                                            
                                            // Regenerate variants immediately with the updated colorHex
                                            // Pass the updated state directly so it uses the latest values
                                            setTimeout(() => {
                                              console.log('Regenerating variants after color change with new hex:', newHex)
                                              generateVariantsFromConfig(updated)
                                            }, 0)
                                            
                                            return updated
                                          })
                                        }}
                                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                        title="Select color"
                                      />
                                      <input
                                        key={`color-hex-input-${attrName}-${value}`}
                                        type="text"
                                        value={colorHex || "#cccccc"}
                                        onChange={(e) => {
                                          let newHex = e.target.value
                                          // Allow user to type freely - don't restrict while typing
                                          // Just ensure # is present
                                          if (newHex && !newHex.startsWith("#")) {
                                            newHex = "#" + newHex
                                          }
                                          
                                          // Update state immediately for display, but don't regenerate variants yet
                                          setAttributeValueColorHex(prev => {
                                            const updated = {
                                              ...prev,
                                              [attrName]: {
                                                ...(prev[attrName] || {}),
                                                [value]: newHex || "#cccccc"
                                              }
                                            }
                                            return updated
                                          })
                                        }}
                                        onBlur={(e) => {
                                          // When user finishes typing, validate and format the hex
                                          let newHex = e.target.value.trim()
                                          if (!newHex || newHex === "#") {
                                            newHex = "#cccccc"
                                          } else if (!newHex.startsWith("#")) {
                                            newHex = "#" + newHex
                                          }
                                          // Remove any invalid characters
                                          newHex = newHex.replace(/[^0-9A-Fa-f#]/g, '')
                                          // Ensure it starts with #
                                          if (!newHex.startsWith("#")) {
                                            newHex = "#" + newHex.replace(/#/g, '')
                                          }
                                          // Limit to 7 characters (# + 6 hex digits)
                                          if (newHex.length > 7) {
                                            newHex = newHex.substring(0, 7)
                                          }
                                          // Pad to 6 digits if needed (after #)
                                          if (newHex.length > 1 && newHex.length < 7) {
                                            const hexPart = newHex.substring(1)
                                            newHex = "#" + hexPart + "0".repeat(6 - hexPart.length)
                                          }
                                          // Validate final format - if invalid, use default
                                          if (!/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
                                            newHex = "#cccccc"
                                          }
                                          
                                          // Update with validated hex and regenerate variants
                                          setAttributeValueColorHex(prev => {
                                            const updated = {
                                              ...prev,
                                              [attrName]: {
                                                ...(prev[attrName] || {}),
                                                [value]: newHex
                                              }
                                            }
                                            // Regenerate variants only when user finishes typing
                                            setTimeout(() => {
                                              generateVariantsFromConfig(updated)
                                            }, 0)
                                            return updated
                                          })
                                        }}
                                        placeholder="#000000"
                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                                        title="Enter hex color code (e.g., #FF0000)"
                                      />
                                    </div>
                                  )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                      // Remove color hex when removing value
                                      if (isColorAttribute) {
                                        setAttributeValueColorHex(prev => {
                                          const newHex = { ...prev }
                                          if (newHex[attrName]) {
                                            const { [value]: removed, ...rest } = newHex[attrName]
                                            newHex[attrName] = rest
                                          }
                                          return newHex
                                        })
                                      }
                                    removeAttributeValue(attrName, value)
                                  }}
                                  className="text-gray-400 hover:text-red-500"
                                    title="Delete color option"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                </div>
                              </div>
                              
                              {/* Image Gallery for this Attribute Value */}
                              {valueImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                  {valueImages.map((imgUrl, imgIdx) => (
                                    <div key={imgIdx} className="relative group">
                                      <img
                                        src={imgUrl}
                                        alt={`${value} image ${imgIdx + 1}`}
                                        className="w-full h-16 object-cover rounded border border-gray-300"
                                        crossOrigin="anonymous"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          // Use a data URI for placeholder to avoid network requests
                                          const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E"
                                          if (target.src !== placeholder) {
                                            target.src = placeholder
                                          }
                                        }}
                                      />
                                      <div className="absolute top-0.5 left-0.5 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                        {imgIdx + 1}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newImages = valueImages.filter((_, i) => i !== imgIdx)
                                          setAttributeValueImages(prev => ({
                                            ...prev,
                                            [attrName]: {
                                              ...(prev[attrName] || {}),
                                              [value]: newImages
                                            }
                                          }))
                                          // Regenerate variants to update their images
                                          setTimeout(() => generateVariantsFromConfig(), 100)
                                        }}
                                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Add Images for this Attribute Value (only if this is the image attribute) */}
                              {isImageAttribute && (
                              <div className="space-y-2">
                                {/* File Upload */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                                  <input
                                    type="file"
                                    id={`attr-value-image-upload-${attrName}-${value}`}
                                    name={`attr-value-image-upload-${attrName}-${value}`}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || [])
                                      const imageFiles = files.filter(file => file.type.startsWith("image/"))
                                      
                                      if (imageFiles.length === 0) {
                                        alert("Please select image files only")
                                        e.target.value = ""
                                        return
                                      }
                                      
                                      const newImageUrls: string[] = []
                                      
                                      for (const file of imageFiles) {
                                        try {
                                          const base64Url = await new Promise<string>((resolve, reject) => {
                                            const reader = new FileReader()
                                            reader.onload = (event) => {
                                              const result = event.target?.result as string
                                              if (result) {
                                                resolve(result)
                                              } else {
                                                reject(new Error("Failed to read file"))
                                              }
                                            }
                                            reader.onerror = () => reject(new Error("File read error"))
                                            reader.readAsDataURL(file)
                                          })
                                          newImageUrls.push(base64Url)
                                        } catch (error) {
                                          console.error("Error reading file:", file.name, error)
                                          alert(`Failed to read file: ${file.name}`)
                                        }
                                      }
                                      
                                      if (newImageUrls.length > 0) {
                                        const currentImages = attributeValueImages[attrName]?.[value] || []
                                        const updatedImages = [...currentImages, ...newImageUrls]
                                        console.log(`Adding ${newImageUrls.length} images to ${attrName}:${value}. Total: ${updatedImages.length}`)
                                        setAttributeValueImages(prev => ({
                                          ...prev,
                                          [attrName]: {
                                            ...(prev[attrName] || {}),
                                            [value]: updatedImages
                                          }
                                        }))
                                        // Regenerate variants to update their images immediately
                                        setTimeout(() => {
                                          console.log("Regenerating variants after adding images to attribute value")
                                          generateVariantsFromConfig()
                                        }, 100)
                                      }
                                      
                                      e.target.value = ""
                                    }}
                                  />
                                  <label
                                    htmlFor={`attr-value-image-upload-${attrName}-${value}`}
                                    className="flex flex-col items-center justify-center cursor-pointer"
                                  >
                                    <Upload className="w-4 h-4 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-600">Upload images for {value}</span>
                                  </label>
                                </div>
                                
                                {/* URL Input */}
                                <div className="flex gap-2">
                                  <Input
                                    id={`attr-value-image-input-${attrName}-${value}`}
                                    name={`attr-value-image-input-${attrName}-${value}`}
                                    type="url"
                                    autoComplete="url"
                                    placeholder="Or enter image URL"
                                    className="flex-1 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        const input = e.target as HTMLInputElement
                                        if (input.value.trim()) {
                                          const imageUrl = input.value.trim()
                                          const currentImages = attributeValueImages[attrName]?.[value] || []
                                          const updatedImages = [...currentImages, imageUrl]
                                          console.log(`Adding image URL to ${attrName}:${value}. Total: ${updatedImages.length}`)
                                          setAttributeValueImages(prev => ({
                                            ...prev,
                                            [attrName]: {
                                              ...(prev[attrName] || {}),
                                              [value]: updatedImages
                                            }
                                          }))
                                          // Regenerate variants to update their images immediately
                                          setTimeout(() => {
                                            console.log("Regenerating variants after adding image URL to attribute value")
                                            generateVariantsFromConfig()
                                          }, 100)
                                          input.value = ""
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input = document.getElementById(`attr-value-image-input-${attrName}-${value}`) as HTMLInputElement
                                      if (input && input.value.trim()) {
                                        const imageUrl = input.value.trim()
                                        const currentImages = attributeValueImages[attrName]?.[value] || []
                                        setAttributeValueImages(prev => ({
                                          ...prev,
                                          [attrName]: {
                                            ...(prev[attrName] || {}),
                                            [value]: [...currentImages, imageUrl]
                                          }
                                        }))
                                        // Regenerate variants to update their images
                                        setTimeout(() => generateVariantsFromConfig(), 100)
                                        input.value = ""
                                      }
                                    }}
                                    title="Add image"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Add Value Input */}
                      <div className="flex gap-2">
                        <Input
                          id={`attr-value-${attrName}`}
                          name={`attr-value-${attrName}`}
                          type="text"
                          autoComplete="off"
                          placeholder={`Add ${attrName} value`}
                          className="flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const input = e.target as HTMLInputElement
                              if (input.value.trim()) {
                                addAttributeValue(attrName, input.value.trim())
                                input.value = ""
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`attr-value-${attrName}`) as HTMLInputElement
                            if (input && input.value.trim()) {
                              addAttributeValue(attrName, input.value.trim())
                              input.value = ""
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Product Variants Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">Product Variants</Label>
                  {Object.keys(variantConfig).length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="group-by-select" className="text-sm text-gray-600">Group by:</Label>
                      <select
                        id="group-by-select"
                        name="group-by-select"
                        value={variantGroupBy}
                        onChange={(e) => setVariantGroupBy(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">None</option>
                        {Object.keys(variantConfig).map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                      </select>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                        <Input
                          type="text"
                          placeholder="Search variants..."
                          value={variantSearch}
                          onChange={(e) => setVariantSearch(e.target.value)}
                          className="pl-8 text-sm w-48"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {Object.keys(variantConfig).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Configure variant attributes above to automatically generate variants.</p>
                ) : productVariants.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No variants generated. Add values to your attributes to create variants.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {productVariants.map((variant, index) => {
                      // Parse variant images - handle both string (JSON) and array formats
                      let variantImages: string[] = []
                      try {
                        if (variant.mediaUrls) {
                          if (typeof variant.mediaUrls === 'string') {
                            const parsed = JSON.parse(variant.mediaUrls)
                            variantImages = Array.isArray(parsed) ? parsed : []
                          } else if (Array.isArray(variant.mediaUrls)) {
                            variantImages = variant.mediaUrls
                          }
                        }
                        // Fallback to imageUrl if no mediaUrls
                        if (variantImages.length === 0 && variant.imageUrl) {
                          variantImages = [variant.imageUrl]
                        }
                      } catch {
                        // If parsing fails, use imageUrl as fallback
                        if (variant.imageUrl) {
                          variantImages = [variant.imageUrl]
                        }
                      }
                      
                      // Parse variant attributes
                      let variantAttrs: Record<string, string> = {}
                      try {
                        if (variant.attributes) {
                          variantAttrs = JSON.parse(variant.attributes)
                        }
                      } catch {
                        variantAttrs = {}
                      }
                      
                      // Get configured variant attributes
                      let configuredAttributes: string[] = []
                      try {
                        if (productForm.variantAttributes) {
                          configuredAttributes = JSON.parse(productForm.variantAttributes)
                        }
                      } catch {
                        configuredAttributes = []
                      }
                      
                      return (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          {/* Dynamic Variant Attributes */}
                          {configuredAttributes.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {configuredAttributes.map((attrName) => (
                                <div key={attrName}>
                                  <Label htmlFor={`variant-attr-${index}-${attrName}`} className="text-xs">{attrName} *</Label>
                              <Input
                                    id={`variant-attr-${index}-${attrName}`}
                                    name={`variant-attr-${index}-${attrName}`}
                                    type="text"
                                    autoComplete="off"
                                    value={variantAttrs[attrName] || ""}
                                    onChange={(e) => {
                                      const newAttrs = { ...variantAttrs, [attrName]: e.target.value }
                                      updateVariant(index, "attributes", JSON.stringify(newAttrs))
                                    }}
                                    placeholder={`Enter ${attrName.toLowerCase().replace(/"/g, '&quot;')}`}
                                className="text-sm"
                              />
                            </div>
                              ))}
                            </div>
                          ) : (
                            // Legacy Color Field (for backward compatibility)
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor={`variant-color-${index}`} className="text-xs">Color Name *</Label>
                              <Input
                                  id={`variant-color-${index}`}
                                  name={`variant-color-${index}`}
                                  type="text"
                                  autoComplete="off"
                                  value={variant.color || ""}
                                onChange={(e) => updateVariant(index, "color", e.target.value)}
                                placeholder="e.g., Charcoal, Cream, Navy"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          )}
                          
                          {/* Variant Images (Read-only, automatically from attribute values) */}
                          {variantImages.length > 0 && (
                          <div>
                              <Label className="text-xs mb-2 block">Images (from attribute values)</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {variantImages.map((url, imgIndex) => (
                                  <div key={imgIndex} className="relative">
                                    <img
                                      src={url}
                                      alt={`Variant image ${imgIndex + 1}`}
                                      className="w-full h-16 object-cover rounded border border-gray-300"
                                      crossOrigin="anonymous"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (target.src !== "https://via.placeholder.com/150?text=Invalid+URL") {
                                          target.src = "https://via.placeholder.com/150?text=Invalid+URL"
                                        }
                                      }}
                                    />
                                    <div className="absolute top-0.5 left-0.5 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                      {imgIndex + 1}
                              </div>
                            </div>
                                ))}
                          </div>
                              <p className="text-xs text-gray-400 mt-1">Images are managed in the Variant Definitions section above</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor={`variant-price-override-${index}`} className="text-xs">Price Override</Label>
                              <Input
                                  id={`variant-price-override-${index}`}
                                  name={`variant-price-override-${index}`}
                                type="number"
                                  autoComplete="off"
                                value={variant.priceOverride || ""}
                                onChange={(e) => updateVariant(index, "priceOverride", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="Optional"
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                  <Label htmlFor={`variant-sku-${index}`} className="text-xs">SKU</Label>
                                <Input
                                    id={`variant-sku-${index}`}
                                    name={`variant-sku-${index}`}
                                    type="text"
                                    autoComplete="off"
                                  value={variant.sku || ""}
                                  onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                  placeholder="Variant SKU"
                                  className="text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVariant(index)}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                      )
                    })}
                  </div>
                )}
                
                {editingProduct && productVariants.length > 0 && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveVariants(editingProduct.id)}
                      className="w-full"
                    >
                      Save Variants
                    </Button>
                  </div>
                )}
              </div>

              {/* Availability and Status Settings */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Always Available</Label>
                    <p className="text-xs text-gray-500">Product is always available regardless of stock level</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.alwaysAvailable}
                      onChange={(e) => setProductForm({ ...productForm, alwaysAvailable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ed6b3e]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ed6b3e]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Product Status</Label>
                    <p className="text-xs text-gray-500">Active products appear to customers, Draft products are hidden</p>
                  </div>
                  <Button
                    type="button"
                    variant={productForm.status === "Active" ? "default" : "outline"}
                    onClick={() => setProductForm({ ...productForm, status: productForm.status === "Active" ? "Draft" : "Active" })}
                    className={productForm.status === "Active" ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-300"}
                  >
                    {productForm.status === "Active" ? "✓ Active" : "Draft"}
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  className="flex-1 bg-[#ed6b3e] hover:bg-[#d55a2e]"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
                <Button variant="outline" onClick={() => setShowProductModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Variant Images Modal */}
      {viewingVariantImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewingVariantImages(null)}>
          <Card className="w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {viewingVariantImages.variantName} - Images
              </h2>
              <button onClick={() => setViewingVariantImages(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {viewingVariantImages.images.length > 0 ? (
              <div className="relative">
                {/* Image Carousel */}
                <div className="relative w-full h-96 mb-4 rounded-lg overflow-hidden bg-gray-100">
                  {viewingVariantImages.images.map((imgUrl, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={imgUrl}
                      alt={`${viewingVariantImages.variantName} - Image ${imgIndex + 1}`}
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                        imgIndex === variantImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      crossOrigin="anonymous"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== "https://via.placeholder.com/150?text=Invalid+URL") {
                          target.src = "https://via.placeholder.com/150?text=Invalid+URL"
                        }
                      }}
                    />
                  ))}
                </div>
                
                {/* Carousel Navigation */}
                {viewingVariantImages.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setVariantImageIndex((prev) => (prev - 1 + viewingVariantImages.images.length) % viewingVariantImages.images.length)
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setVariantImageIndex((prev) => (prev + 1) % viewingVariantImages.images.length)
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="flex justify-center gap-2 mb-4">
                      {viewingVariantImages.images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-opacity cursor-pointer ${
                            idx === variantImageIndex 
                              ? 'bg-[#ed6b3e] opacity-100' 
                              : 'bg-gray-300 opacity-50'
                          }`}
                          onClick={() => setVariantImageIndex(idx)}
                        />
                      ))}
                    </div>
                    
                    {/* Image Counter */}
                    <div className="text-center text-sm text-gray-500 mb-4">
                      {variantImageIndex + 1} / {viewingVariantImages.images.length}
                    </div>
                  </>
                )}
                
                {/* Thumbnail Grid */}
                <div className="grid grid-cols-6 gap-2 mt-4">
                  {viewingVariantImages.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                        idx === variantImageIndex ? 'border-[#ed6b3e]' : 'border-gray-300'
                      }`}
                      onClick={() => setVariantImageIndex(idx)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-20 object-cover"
                        crossOrigin="anonymous"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No images available for this variant</p>
            )}
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Orders</h2>
            <p className="text-gray-600 mt-1">View and manage all customer orders</p>
          </div>
          <OrdersTab />
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Sales</h2>
            <p className="text-gray-600 mt-1">View sales reports and analytics</p>
          </div>
          <SalesTab />
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Customers</h2>
            <p className="text-gray-600 mt-1">View all customers who have ordered or signed up</p>
          </div>
          <CustomersTab />
        </div>
      )}

      {/* Promo Codes Tab */}
      {activeTab === "promocodes" && (
        <PromoCodesTab 
          promoCodes={promoCodes}
          setPromoCodes={setPromoCodes}
          users={users}
          products={products}
          loading={loading}
          hasPermission={hasPermission}
          userRoles={userRoles}
        />
      )}

    </div>
  )
}

// Promo Codes Tab Component
function PromoCodesTab({ 
  promoCodes, 
  setPromoCodes, 
  users, 
  products, 
  loading,
  hasPermission,
  userRoles
}: { 
  promoCodes: any[]
  setPromoCodes: (codes: any[]) => void
  users: any[]
  products: any[]
  loading: boolean
  hasPermission: (resource: string, action: string) => boolean
  userRoles: string[]
}) {
  const [showModal, setShowModal] = useState(false)
  const [editingPromoCode, setEditingPromoCode] = useState<any | null>(null)
  const [promoCodeForm, setPromoCodeForm] = useState({
    code: "",
    description: "",
    discountType: "Percentage" as "Percentage" | "Fixed",
    discountValue: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    usageLimit: "",
    usageLimitPerUser: "",
    minimumOrderAmount: "",
    maximumDiscountAmount: "",
    userIds: [] as number[],
    emailAddresses: [] as string[],
    productIds: [] as number[],
    sendEmailNotification: true
  })
  const [emailInput, setEmailInput] = useState("")
  const [selectedPromoCodeId, setSelectedPromoCodeId] = useState<number | null>(null)
  const [usageDetails, setUsageDetails] = useState<any>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }

  const openModal = (promoCode?: any) => {
    if (promoCode) {
      setEditingPromoCode(promoCode)
      setPromoCodeForm({
        code: promoCode.code || "",
        description: promoCode.description || "",
        discountType: promoCode.discountType || "Percentage",
        discountValue: promoCode.discountValue?.toString() || "",
        startDate: promoCode.startDate ? new Date(promoCode.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: promoCode.endDate ? new Date(promoCode.endDate).toISOString().split('T')[0] : "",
        usageLimit: promoCode.usageLimit?.toString() || "",
        usageLimitPerUser: promoCode.usageLimitPerUser?.toString() || "",
        minimumOrderAmount: promoCode.minimumOrderAmount?.toString() || "",
        maximumDiscountAmount: promoCode.maximumDiscountAmount?.toString() || "",
        userIds: promoCode.userIds || [],
        emailAddresses: [],
        productIds: promoCode.productIds || [],
        sendEmailNotification: false
      })
      setEmailInput("")
    } else {
      setEditingPromoCode(null)
      setPromoCodeForm({
        code: "",
        description: "",
        discountType: "Percentage",
        discountValue: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        usageLimit: "",
        usageLimitPerUser: "",
        minimumOrderAmount: "",
        maximumDiscountAmount: "",
        userIds: [],
        emailAddresses: [],
        productIds: [],
        sendEmailNotification: true
      })
      setEmailInput("")
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPromoCode(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const headers = getAuthHeaders()
    const payload = {
      code: promoCodeForm.code,
      description: promoCodeForm.description || null,
      discountType: promoCodeForm.discountType,
      discountValue: parseFloat(promoCodeForm.discountValue),
      startDate: promoCodeForm.startDate,
      endDate: promoCodeForm.endDate || null,
      usageLimit: promoCodeForm.usageLimit ? parseInt(promoCodeForm.usageLimit) : null,
      usageLimitPerUser: promoCodeForm.usageLimitPerUser ? parseInt(promoCodeForm.usageLimitPerUser) : null,
      minimumOrderAmount: promoCodeForm.minimumOrderAmount ? parseFloat(promoCodeForm.minimumOrderAmount) : null,
      maximumDiscountAmount: promoCodeForm.maximumDiscountAmount ? parseFloat(promoCodeForm.maximumDiscountAmount) : null,
      userIds: promoCodeForm.userIds.length > 0 ? promoCodeForm.userIds : null,
      emailAddresses: promoCodeForm.emailAddresses.length > 0 ? promoCodeForm.emailAddresses : null,
      productIds: promoCodeForm.productIds.length > 0 ? promoCodeForm.productIds : null,
      sendEmailNotification: promoCodeForm.sendEmailNotification
    }

    try {
      let response
      if (editingPromoCode) {
        response = await fetch(`${API_BASE_URL}/api/PromoCode/${editingPromoCode.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(`${API_BASE_URL}/api/PromoCode`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        // Refresh promo codes list
        const promoCodesRes = await fetch(`${API_BASE_URL}/api/PromoCode`, { headers })
        if (promoCodesRes.ok) {
          const data = await promoCodesRes.json()
          setPromoCodes(data)
        }
        closeModal()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save promo code")
      }
    } catch (error) {
      console.error("Error saving promo code:", error)
      alert("An error occurred while saving the promo code")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code? This will expire it for all users.")) {
      return
    }

    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/PromoCode/${id}`, {
        method: "DELETE",
        headers
      })

      if (response.ok) {
        // Refresh promo codes list
        const promoCodesRes = await fetch(`${API_BASE_URL}/api/PromoCode`, { headers })
        if (promoCodesRes.ok) {
          const data = await promoCodesRes.json()
          setPromoCodes(data)
        }
      } else {
        const error = await response.json()
        alert(error.message || "Failed to delete promo code")
      }
    } catch (error) {
      console.error("Error deleting promo code:", error)
      alert("An error occurred while deleting the promo code")
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPromoCodeForm({ ...promoCodeForm, code })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ed6b3e] mx-auto mb-4" />
          <p className="text-gray-500">Loading promo codes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-gray-600 mt-1">Create and manage discount codes for customers</p>
        </div>
        {(hasPermission("PromoCodes", "Create") || userRoles.includes("SuperAdmin")) && (
          <Button onClick={() => openModal()} className="bg-[#ed6b3e] hover:bg-[#d55a2e]">
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        )}
      </div>

      {promoCodes.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Promo Codes</h3>
          <p className="text-gray-500 mb-4">Create your first promo code to offer discounts to customers.</p>
          {(hasPermission("PromoCodes", "Create") || userRoles.includes("SuperAdmin")) && (
            <Button onClick={() => openModal()} className="bg-[#ed6b3e] hover:bg-[#d55a2e]">
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="text-sm text-gray-600 font-gill-sans mb-6">
            Showing {promoCodes.length} promo code{promoCodes.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-4">
            {promoCodes.map((promoCode) => (
              <Card key={promoCode.id} className={`p-6 ${!promoCode.isValid ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-base">{promoCode.code}</h3>
                      {promoCode.isValid && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                      {promoCode.isExpired && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                          Expired
                        </span>
                      )}
                      {!promoCode.isActive && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          Deactivated
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Promo Code Details:</p>
                        <div className="space-y-1">
                          {promoCode.description && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Description:</span> {promoCode.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Discount:</span> {promoCode.discountType === "Percentage" 
                              ? `${promoCode.discountValue}%` 
                              : `LE ${promoCode.discountValue}`}
                          </p>
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Valid:</span> {new Date(promoCode.startDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })} - {promoCode.endDate ? new Date(promoCode.endDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            }) : "No expiration"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Usage & Restrictions:</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Usage:</span> {promoCode.usedCount} / {promoCode.usageLimit || "∞"}
                          </p>
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Users:</span> {promoCode.userCount || "All"}
                          </p>
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Products:</span> {promoCode.productCount === 0 ? "All" : promoCode.productCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  
                  {/* Usage Details Section */}
                  {selectedPromoCodeId === promoCode.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {loadingUsage ? (
                        <div className="text-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-2">Loading usage details...</p>
                        </div>
                      ) : usageDetails && usageDetails.userUsages && usageDetails.userUsages.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Usage by User:</h4>
                          {usageDetails.userUsages.map((userUsage: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{userUsage.userName}</p>
                                  {userUsage.userEmail && (
                                    <p className="text-xs text-gray-500">{userUsage.userEmail}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {userUsage.usageCount} / {userUsage.usageLimit || "∞"}
                                  </p>
                                  {userUsage.hasExceededLimit && (
                                    <span className="text-xs text-red-600 font-medium">Limit Exceeded</span>
                                  )}
                                </div>
                              </div>
                              {userUsage.usageRecords && userUsage.usageRecords.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Order History:</p>
                                  {userUsage.usageRecords.map((record: any, recordIdx: number) => (
                                    <div key={recordIdx} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                                      <span className="text-gray-600">
                                        Order #{record.orderNumber} - {new Date(record.usedAt).toLocaleDateString()}
                                      </span>
                                      <span className="text-green-600 font-medium">
                                        -LE {record.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No usage recorded yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (selectedPromoCodeId === promoCode.id) {
                        setSelectedPromoCodeId(null)
                        setUsageDetails(null)
                      } else {
                        setSelectedPromoCodeId(promoCode.id)
                        setLoadingUsage(true)
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/PromoCode/${promoCode.id}`, { headers: getAuthHeaders() })
                          if (res.ok) {
                            const data = await res.json()
                            setUsageDetails(data)
                          }
                        } catch (err) {
                          console.error("Error fetching usage details:", err)
                        } finally {
                          setLoadingUsage(false)
                        }
                      }
                    }}
                    title="View usage details"
                  >
                    {selectedPromoCodeId === promoCode.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  {(hasPermission("PromoCodes", "Update") || userRoles.includes("SuperAdmin")) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Fetch full promo code details
                        fetch(`${API_BASE_URL}/api/PromoCode/${promoCode.id}`, { headers: getAuthHeaders() })
                          .then(res => res.json())
                          .then(data => openModal(data))
                          .catch(err => console.error("Error fetching promo code:", err))
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {(hasPermission("PromoCodes", "Delete") || userRoles.includes("SuperAdmin")) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(promoCode.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingPromoCode ? "Edit Promo Code" : "Create Promo Code"}
                </h3>
                <Button variant="outline" size="sm" onClick={closeModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Promo Code *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={promoCodeForm.code}
                        onChange={(e) => setPromoCodeForm({ ...promoCodeForm, code: e.target.value.toUpperCase() })}
                        required
                        placeholder="SUMMER2024"
                      />
                      {!editingPromoCode && (
                        <Button type="button" variant="outline" onClick={generateCode}>
                          Generate
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <select
                      id="discountType"
                      value={promoCodeForm.discountType}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, discountType: e.target.value as "Percentage" | "Fixed" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discountValue">Discount Value *</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step="0.01"
                      min="0"
                      max={promoCodeForm.discountType === "Percentage" ? "100" : undefined}
                      value={promoCodeForm.discountValue}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, discountValue: e.target.value })}
                      required
                      placeholder={promoCodeForm.discountType === "Percentage" ? "10" : "50"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="usageLimit">Usage Limit (Total)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={promoCodeForm.usageLimit}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, usageLimit: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimitPerUser">Usage Limit Per User</Label>
                    <Input
                      id="usageLimitPerUser"
                      type="number"
                      min="1"
                      value={promoCodeForm.usageLimitPerUser}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, usageLimitPerUser: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimumOrderAmount">Minimum Order Amount</Label>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={promoCodeForm.minimumOrderAmount}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, minimumOrderAmount: e.target.value })}
                      placeholder="Leave empty for no minimum"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maximumDiscountAmount">Maximum Discount Amount</Label>
                  <Input
                    id="maximumDiscountAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoCodeForm.maximumDiscountAmount}
                    onChange={(e) => setPromoCodeForm({ ...promoCodeForm, maximumDiscountAmount: e.target.value })}
                    placeholder="Leave empty for no maximum"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={promoCodeForm.startDate}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={promoCodeForm.endDate}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, endDate: e.target.value })}
                      min={promoCodeForm.startDate}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={promoCodeForm.description}
                    onChange={(e) => setPromoCodeForm({ ...promoCodeForm, description: e.target.value })}
                    placeholder="Optional description for this promo code"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Select Customers</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select customers to send promo codes to. All customers can receive promo codes, but they must be logged in to use them.
                  </p>
                  <p className="text-xs text-amber-600 mb-2 font-medium">
                    ⚠️ Leave empty to allow all registered customers
                  </p>
                  <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                    {users.map((customer: any) => {
                      const isRegistered = customer.isRegistered && customer.id > 0
                      const isSelectedAsUser = isRegistered && promoCodeForm.userIds.includes(customer.id)
                      const isSelectedAsEmail = customer.email && promoCodeForm.emailAddresses.includes(customer.email.toLowerCase())
                      const isSelected = isSelectedAsUser || isSelectedAsEmail
                      
                      return (
                        <label 
                          key={customer.id || customer.email || customer.phone} 
                          className="flex items-center gap-2 py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (isRegistered) {
                                  // Add to userIds for registered users
                                  setPromoCodeForm({ 
                                    ...promoCodeForm, 
                                    userIds: [...promoCodeForm.userIds, customer.id],
                                    // Also add email if not already there (for email notification)
                                    emailAddresses: customer.email && !promoCodeForm.emailAddresses.includes(customer.email.toLowerCase())
                                      ? [...promoCodeForm.emailAddresses, customer.email.toLowerCase()]
                                      : promoCodeForm.emailAddresses
                                  })
                                } else if (customer.email) {
                                  // Add to emailAddresses for non-registered customers
                                  setPromoCodeForm({ 
                                    ...promoCodeForm, 
                                    emailAddresses: [...promoCodeForm.emailAddresses, customer.email.toLowerCase()] 
                                  })
                                }
                              } else {
                                if (isRegistered) {
                                  // Remove from userIds
                                  setPromoCodeForm({ 
                                    ...promoCodeForm, 
                                    userIds: promoCodeForm.userIds.filter(id => id !== customer.id)
                                  })
                                }
                                if (customer.email) {
                                  // Remove from emailAddresses
                                  setPromoCodeForm({ 
                                    ...promoCodeForm, 
                                    emailAddresses: promoCodeForm.emailAddresses.filter(email => email !== customer.email.toLowerCase())
                                  })
                                }
                              }
                            }}
                          />
                          <span className="text-sm flex-1">
                            {customer.fullName} 
                            {customer.email && ` (${customer.email})`}
                            {customer.phone && !customer.email && ` (${customer.phone})`}
                          </span>
                          {isRegistered ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Registered</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              {customer.orderCount || 0} order{customer.orderCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label>Send to Additional Email Addresses (Optional)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enter additional email addresses to send promo code notifications. All recipients will receive the code but must be logged in to use it.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const email = emailInput.trim().toLowerCase()
                          if (email && email.includes('@') && !promoCodeForm.emailAddresses.includes(email)) {
                            setPromoCodeForm({ ...promoCodeForm, emailAddresses: [...promoCodeForm.emailAddresses, email] })
                            setEmailInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const email = emailInput.trim().toLowerCase()
                        if (email && email.includes('@') && !promoCodeForm.emailAddresses.includes(email)) {
                          setPromoCodeForm({ ...promoCodeForm, emailAddresses: [...promoCodeForm.emailAddresses, email] })
                          setEmailInput("")
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {promoCodeForm.emailAddresses.length > 0 && (
                    <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                      {promoCodeForm.emailAddresses.map((email, index) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm">{email}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPromoCodeForm({
                                ...promoCodeForm,
                                emailAddresses: promoCodeForm.emailAddresses.filter((_, i) => i !== index)
                              })
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Select Products</Label>
                  <p className="text-xs text-gray-500 mb-2">Leave empty to apply to all products</p>
                  <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                    {products.filter(p => p.isActive).map((product) => (
                      <label key={product.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={promoCodeForm.productIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPromoCodeForm({ ...promoCodeForm, productIds: [...promoCodeForm.productIds, product.id] })
                            } else {
                              setPromoCodeForm({ ...promoCodeForm, productIds: promoCodeForm.productIds.filter(id => id !== product.id) })
                            }
                          }}
                        />
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {!editingPromoCode && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={promoCodeForm.sendEmailNotification}
                      onChange={(e) => setPromoCodeForm({ ...promoCodeForm, sendEmailNotification: e.target.checked })}
                    />
                    <Label htmlFor="sendEmail" className="cursor-pointer">
                      Send email notification to selected customers
                    </Label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#ed6b3e] hover:bg-[#d55a2e]">
                    {editingPromoCode ? "Update" : "Create"} Promo Code
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Orders Tab Component
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [downPaymentAmounts, setDownPaymentAmounts] = useState<Record<number, string>>({})
  const [showDownPaymentModal, setShowDownPaymentModal] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE_URL}/api/Sales`, { headers })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        const errorText = await res.text().catch(() => "Failed to fetch orders")
        let errorMessage = "Failed to fetch orders"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.Message || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${res.status}: ${res.statusText}`
        }
        
        // If 403, suggest re-login
        if (res.status === 403) {
          errorMessage = "Access denied. You need Admin or SuperAdmin role. Please log out and log back in to refresh your token."
        }
        
        console.error("Error fetching orders:", errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders"
      console.error("Error fetching orders:", errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string, downPayment?: number) => {
    setUpdatingStatus(orderId)
    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        alert("You must be logged in to update orders")
        return
      }

      const updateData: any = {
        status: newStatus,
      }

      // If confirming order and down payment is provided, include it
      if (newStatus === "Confirmed" && downPayment !== undefined) {
        updateData.downPayment = downPayment
        updateData.paymentStatus = downPayment > 0 ? "PartiallyPaid" : "Pending"
      }

      const res = await fetch(`${API_BASE_URL}/api/Sales/${orderId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        // Refresh orders list
        await fetchOrders()
        setShowDownPaymentModal(null)
        setDownPaymentAmounts({ ...downPaymentAmounts, [orderId]: "" })
        alert("Order status updated successfully")
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to update order status" }))
        alert(errorData.message || "Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("An error occurred while updating the order status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const deleteOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderNumber}? This action cannot be undone.`)) {
      return
    }

    setUpdatingStatus(orderId)
    try {
      const token = sessionStorage.getItem("authToken")
      if (!token) {
        alert("You must be logged in to delete orders")
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/Sales/${orderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        // Refresh orders list
        await fetchOrders()
        alert("Order deleted successfully")
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to delete order" }))
        alert(errorData.message || "Failed to delete order. Only pending orders can be deleted.")
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("An error occurred while deleting the order")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleConfirmOrder = (orderId: number, totalAmount: number) => {
    setShowDownPaymentModal(orderId)
    // Pre-fill with 30% down payment as default
    const defaultDownPayment = (totalAmount * 0.3).toFixed(2)
    setDownPaymentAmounts({ ...downPaymentAmounts, [orderId]: defaultDownPayment })
  }

  const handleConfirmWithDownPayment = (orderId: number, newStatus: string) => {
    const downPaymentValue = parseFloat(downPaymentAmounts[orderId] || "0")
    if (isNaN(downPaymentValue) || downPaymentValue < 0) {
      alert("Please enter a valid down payment amount")
      return
    }
    updateOrderStatus(orderId, newStatus, downPaymentValue)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  // Filter orders by status (treat Completed same as Delivered)
  const filteredOrders = statusFilter === "All" 
    ? orders 
    : statusFilter === "Delivered"
    ? orders.filter((order) => order.status === "Delivered" || order.status === "Completed")
    : orders.filter((order) => order.status === statusFilter)

  const statusOptions = [
    { value: "All", label: "All", count: orders.length },
    { value: "Pending", label: "Pending", count: orders.filter((o: any) => o.status === "Pending").length },
    { value: "Confirmed", label: "Confirmed", count: orders.filter((o: any) => o.status === "Confirmed").length },
    { value: "Shipped", label: "Shipped", count: orders.filter((o: any) => o.status === "Shipped").length },
    { value: "Delivered", label: "Delivered", count: orders.filter((o: any) => o.status === "Delivered" || o.status === "Completed").length },
    { value: "Cancelled", label: "Cancelled", count: orders.filter((o: any) => o.status === "Cancelled").length },
  ]

  return (
    <div className="mt-6 max-w-4xl mx-auto">
      {/* Status Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? option.value === "All"
                    ? "bg-[#ed6b3e] text-white"
                    : option.value === "Pending"
                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                    : option.value === "Confirmed"
                    ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                    : option.value === "Shipped"
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    : option.value === "Delivered"
                    ? "bg-green-100 text-green-700 border-2 border-green-300"
                    : "bg-red-100 text-red-700 border-2 border-red-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 font-gill-sans">
            {orders.length === 0 
              ? "No orders found." 
              : `No ${statusFilter.toLowerCase()} orders found.`}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 font-gill-sans mb-6">
            Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            {statusFilter !== "All" && ` (${statusFilter})`}
          </div>
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-base">#{order.orderNumber}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            order.status === "Delivered" || order.status === "Completed" ? "bg-green-100 text-green-700" :
                            order.status === "Shipped" ? "bg-blue-100 text-blue-700" :
                            order.status === "Confirmed" ? "bg-purple-100 text-purple-700" :
                            order.status === "Cancelled" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {order.status === "Completed" ? "Delivered" : order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          {new Date(order.orderDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-600 mb-2">Order Items:</div>
                            <div className="space-y-2">
                              {order.items.map((item: any, idx: number) => {
                                let variantInfo = ""
                                if (item.variantAttributes) {
                                  try {
                                    const attrs = JSON.parse(item.variantAttributes)
                                    const attrParts = Object.entries(attrs).map(([key, value]) => `${key}: ${value}`)
                                    variantInfo = attrParts.join(", ")
                                  } catch {
                                    variantInfo = item.variantAttributes
                                  }
                                }
                                return (
                                  <div key={item.id || idx} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-xs text-gray-800">{item.productName || "Unknown Product"}</p>
                                        {variantInfo && (
                                          <p className="text-xs text-gray-500 mt-0.5">{variantInfo}</p>
                                        )}
                                        {item.productSKU && (
                                          <p className="text-xs text-gray-400 mt-0.5">SKU: {item.productSKU}</p>
                                        )}
                                      </div>
                                      <div className="text-right ml-3">
                                        <p className="text-xs text-gray-600">
                                          {item.quantity} {item.unit || "piece"}{item.quantity !== 1 ? 's' : ''} @ LE {item.unitPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-900 mt-0.5">
                                          LE {item.totalPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Customer Information */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1.5">Customer Information:</div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Name:</span> {order.customerName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Email:</span> {order.customerEmail || "N/A"}
                            </p>
                            {order.customerPhone && (
                              <p className="text-xs text-gray-800">
                                <span className="font-medium">Phone:</span> {order.customerPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Shipping Information */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1.5">Shipping Information:</div>
                          <div className="space-y-0.5">
                            {order.customerAddress && (
                              <p className="text-xs text-gray-800">
                                <span className="font-medium">Address:</span> {order.customerAddress}
                              </p>
                            )}
                            {order.deliveryDate && (
                              <p className="text-xs text-gray-800">
                                <span className="font-medium">Delivery Date:</span> {new Date(order.deliveryDate).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric"
                                })}
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-xs text-gray-800">
                                <span className="font-medium">Notes:</span> {order.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1.5">Payment Details:</div>
                          <div className="space-y-0.5">
                            {order.promoCode && (
                              <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-700 font-medium">Promo Code:</span>
                                    <span className="text-xs font-semibold text-green-800">{order.promoCode.code}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-green-700">Discount:</span>
                                    <span className="text-xs font-semibold text-green-800 ml-1">
                                      -LE {order.promoCode.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Used by: <span className="font-medium">{order.promoCode.userName || "Guest"}</span> on {new Date(order.promoCode.usedAt).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Total Amount</span>
                              <span className="text-sm font-semibold text-gray-900">
                                LE {order.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                                {order.promoCode && (
                                  <span className="text-xs text-gray-500 ml-2 line-through">
                                    (Original: LE {(order.totalAmount + order.promoCode.discountAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Down Payment</span>
                              <span className="text-sm font-semibold text-[#ed6b3e]">
                                {order.downPayment ? (
                                  <>LE {order.downPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}</>
                                ) : (
                                  <span className="text-gray-400 text-xs">Not set</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-700">Remaining Balance</span>
                              <span className="text-sm font-bold text-blue-600">
                                LE {order.downPayment && order.totalAmount 
                                  ? (order.totalAmount - order.downPayment).toLocaleString("en-US", { minimumFractionDigits: 2 })
                                  : order.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                              </span>
                            </div>
                            <div className="pt-0.5">
                              <span className="text-xs text-gray-500">Payment Status: </span>
                              <span className={`text-xs font-medium ${
                                order.paymentStatus === "Paid" ? "text-green-600" :
                                order.paymentStatus === "PartiallyPaid" ? "text-blue-600" :
                                "text-yellow-600"
                              }`}>
                                {order.paymentStatus || "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Update and Delete */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 flex-1">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Update Status:</label>
                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newStatus = e.target.value
                                if (newStatus === "Confirmed" && !order.downPayment) {
                                  handleConfirmOrder(order.id, order.totalAmount || 0)
                                } else {
                                  updateOrderStatus(order.id, newStatus)
                                }
                              }}
                            disabled={updatingStatus === order.id || order.status === "Delivered" || order.status === "Completed" || order.status === "Cancelled"}
                            className="flex-1 max-w-xs px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#ed6b3e] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                            {updatingStatus === order.id && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Updating...</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteOrder(order.id, order.orderNumber)}
                            disabled={updatingStatus === order.id || order.status !== "Pending"}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={order.status !== "Pending" ? "Only pending orders can be deleted" : "Delete this order"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Down Payment Modal */}
                {showDownPaymentModal === order.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#ed6b3e] p-2 rounded-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Confirm Order with Down Payment</h3>
                      </div>
                      <div className="space-y-5">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Total Order Amount
                          </label>
                          <p className="text-2xl font-bold text-gray-900">
                            LE {order.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Down Payment Amount (LE)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            max={order.totalAmount}
                            value={downPaymentAmounts[order.id] || ""}
                            onChange={(e) => setDownPaymentAmounts({ ...downPaymentAmounts, [order.id]: e.target.value })}
                            placeholder="Enter down payment amount"
                            className="w-full text-lg py-3"
                          />
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Recommended: 30% (LE {order.totalAmount ? (order.totalAmount * 0.3).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"})
                          </p>
                        </div>
                        {downPaymentAmounts[order.id] && parseFloat(downPaymentAmounts[order.id] || "0") > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold">Remaining Balance:</span> LE {
                                (order.totalAmount - parseFloat(downPaymentAmounts[order.id] || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })
                              }
                            </p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Button
                            onClick={() => handleConfirmWithDownPayment(order.id, "Confirmed")}
                            disabled={updatingStatus === order.id}
                            className="flex-1 bg-[#ed6b3e] hover:bg-[#d55a2e] text-white py-2.5 font-semibold"
                          >
                            {updatingStatus === order.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm Order
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowDownPaymentModal(null)
                              setDownPaymentAmounts({ ...downPaymentAmounts, [order.id]: "" })
                            }}
                            variant="outline"
                            disabled={updatingStatus === order.id}
                            className="sm:flex-1 py-2.5"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Sales Tab Component
function SalesTab() {
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Fetch sales orders for analytics
      const res = await fetch(`${API_BASE_URL}/api/Sales`, { headers })
      if (res.ok) {
        const orders = await res.json()
        
        // Calculate sales: Only delivered/completed orders count as sales, but down payments are always included
        const deliveredOrders = orders.filter((o: any) => o.status === "Delivered" || o.status === "Completed")
        const deliveredRevenue = deliveredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
        
        // Down payments from non-delivered/non-completed orders count as sales (delivered/completed orders' down payments are already in totalAmount)
        const nonDeliveredOrders = orders.filter((o: any) => o.status !== "Delivered" && o.status !== "Completed")
        const downPaymentsFromNonDelivered = nonDeliveredOrders.reduce((sum: number, order: any) => sum + (order.downPayment || 0), 0)
        
        // All down payments (for display purposes)
        const totalDownPayments = orders.reduce((sum: number, order: any) => sum + (order.downPayment || 0), 0)
        
        // Total sales = delivered orders revenue + down payments from non-delivered orders
        const totalSales = deliveredRevenue + downPaymentsFromNonDelivered
        
        // Calculate sales per status (for display purposes, show total amounts)
        const salesByStatus = {
          Pending: orders
            .filter((o: any) => o.status === "Pending")
            .reduce((sum: number, order: any) => sum + (order.downPayment || order.totalAmount || 0), 0),
          Confirmed: orders
            .filter((o: any) => o.status === "Confirmed")
            .reduce((sum: number, order: any) => sum + (order.downPayment || order.totalAmount || 0), 0),
          Shipped: orders
            .filter((o: any) => o.status === "Shipped")
            .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
          Delivered: orders
            .filter((o: any) => o.status === "Delivered" || o.status === "Completed")
            .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
          Cancelled: orders
            .filter((o: any) => o.status === "Cancelled")
            .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
        }
        
        const totalOrders = orders.length
        const deliveredOrdersCount = deliveredOrders.length
        
        setSalesData({
          totalSales,
          deliveredRevenue,
          totalDownPayments,
          totalOrders,
          deliveredOrdersCount,
          salesByStatus,
          orders
        })
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ed6b3e] mx-auto mb-4" />
          <p className="text-gray-500">Loading sales data...</p>
        </div>
      </div>
    )
  }

  const pendingOrders = salesData?.orders?.filter((o: any) => o.status === "Pending").length || 0
  const confirmedOrders = salesData?.orders?.filter((o: any) => o.status === "Confirmed").length || 0
  const shippedOrders = salesData?.orders?.filter((o: any) => o.status === "Shipped").length || 0
  const cancelledOrders = salesData?.orders?.filter((o: any) => o.status === "Cancelled").length || 0
  const averageOrderValue = salesData?.deliveredOrdersCount > 0 
    ? (salesData.deliveredRevenue / salesData.deliveredOrdersCount) 
    : 0

  return (
    <div className="mt-6 max-w-6xl mx-auto space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500 p-2.5 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-2">Total Sales</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            LE {salesData?.totalSales?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-xs text-gray-500">Delivered orders + All down payments</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2.5 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-2">Total Orders</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{salesData?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500">All orders placed</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500 p-2.5 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-2">Delivered Orders</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{salesData?.deliveredOrdersCount || 0}</p>
          <p className="text-xs text-gray-500">{salesData?.totalOrders > 0 ? Math.round((salesData.deliveredOrdersCount / salesData.totalOrders) * 100) : 0}% completion rate</p>
        </Card>
      </div>

      {/* Sales by Status */}
      <Card className="p-5 bg-white shadow-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">Sales by Order Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-4 bg-white border-l-4 border-l-yellow-400 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <h3 className="text-xs font-medium text-gray-600">Pending</h3>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              LE {salesData?.salesByStatus?.Pending?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-xs text-gray-500">({pendingOrders} orders)</p>
          </Card>

          <Card className="p-4 bg-white border-l-4 border-l-purple-400 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <h3 className="text-xs font-medium text-gray-600">Confirmed</h3>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              LE {salesData?.salesByStatus?.Confirmed?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-xs text-gray-500">({confirmedOrders} orders)</p>
          </Card>

          <Card className="p-4 bg-white border-l-4 border-l-blue-400 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-medium text-gray-600">Shipped</h3>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              LE {salesData?.salesByStatus?.Shipped?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-xs text-gray-500">({shippedOrders} orders)</p>
          </Card>

          <Card className="p-4 bg-white border-l-4 border-l-green-400 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="text-xs font-medium text-gray-600">Delivered</h3>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              LE {salesData?.salesByStatus?.Delivered?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-xs text-gray-500">({salesData?.orders?.filter((o: any) => o.status === "Delivered" || o.status === "Completed").length || 0} orders)</p>
          </Card>

          <Card className="p-4 bg-white border-l-4 border-l-red-400 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <h3 className="text-xs font-medium text-gray-600">Cancelled</h3>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">
              LE {salesData?.salesByStatus?.Cancelled?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-xs text-gray-500">({cancelledOrders} orders)</p>
          </Card>
        </div>
      </Card>

      {/* Orders List */}
      <Card className="p-5 bg-white shadow-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">All Orders</h3>
        {salesData?.orders && salesData.orders.length > 0 ? (
          <div className="space-y-2">
            {salesData.orders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">#{order.orderNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900 whitespace-nowrap">
                      LE {order.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Shipped"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "Confirmed"
                          ? "bg-purple-100 text-purple-700"
                          : order.status === "Cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </Card>

      {/* Down Payments Summary */}
      <Card className="p-5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Total Down Payments</h3>
            <p className="text-xs text-gray-600">Included in sales regardless of order status</p>
          </div>
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              LE {salesData?.totalDownPayments?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
          </div>
        </div>
      </Card>

      {/* Average Order Value */}
      <Card className="p-5 bg-gradient-to-r from-[#ed6b3e]/10 to-transparent border border-[#ed6b3e]/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Average Delivered Order Value</h3>
            <p className="text-xs text-gray-600">Based on delivered orders only</p>
          </div>
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold text-[#ed6b3e]">
              LE {averageOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Card>

      {(!salesData || salesData.totalOrders === 0) && (
        <Card className="p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sales Data Yet</h3>
          <p className="text-gray-500">Sales statistics will appear here once orders are placed.</p>
        </Card>
      )}
    </div>
  )
}

// Customers Tab Component
function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE_URL}/api/Sales/customers`, { headers })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to fetch customers" }))
        console.error("Error fetching customers:", errorData.message)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ed6b3e] mx-auto mb-4" />
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 max-w-6xl mx-auto">
      {customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Customers Found</h3>
          <p className="text-gray-500">Customers will appear here once they place orders or sign up.</p>
        </Card>
      ) : (
        <>
          <div className="text-sm text-gray-600 font-gill-sans mb-6">
            Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-4">
            {customers.map((customer, index) => (
              <Card key={customer.email || customer.phone || index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-base">{customer.fullName || "Unknown Customer"}</h3>
                      {customer.isRegistered && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                          Registered
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Contact Information:</p>
                        <div className="space-y-1">
                          {customer.email && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Email:</span> {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Phone:</span> {customer.phone}
                            </p>
                          )}
                          {customer.address && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Address:</span> {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Order Statistics:</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Total Orders:</span> {customer.orderCount || 0}
                          </p>
                          <p className="text-xs text-gray-800">
                            <span className="font-medium">Total Spent:</span> LE {customer.totalSpent?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                          </p>
                          {customer.firstOrderDate && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">First Order:</span> {new Date(customer.firstOrderDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          )}
                          {customer.lastOrderDate && (
                            <p className="text-xs text-gray-800">
                              <span className="font-medium">Last Order:</span> {new Date(customer.lastOrderDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


