"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, Check, ArrowRight, Palette, Ruler, FileText, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


interface DesignFormData {
  baseProduct: string
  material: string
  color: string
  width: string
  depth: string
  height: string
  notes: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

const baseProducts = [
  { id: "sofa", name: "Sofa", image: "/placeholder.svg?height=200&width=300", basePrice: 15000 },
  { id: "chair", name: "Chair", image: "/placeholder.svg?height=200&width=300", basePrice: 8000 },
  { id: "table", name: "Table", image: "/placeholder.svg?height=200&width=300", basePrice: 12000 },
  { id: "bed", name: "Bed", image: "/placeholder.svg?height=200&width=300", basePrice: 18000 },
  { id: "cabinet", name: "Cabinet", image: "/placeholder.svg?height=200&width=300", basePrice: 10000 },
  { id: "bookshelf", name: "Bookshelf", image: "/placeholder.svg?height=200&width=300", basePrice: 9000 },
]

const materials = [
  { id: "fabric", name: "Premium Fabric", multiplier: 1.0, texture: "/placeholder.svg?height=60&width=60" },
  { id: "leather", name: "Genuine Leather", multiplier: 1.5, texture: "/placeholder.svg?height=60&width=60" },
  { id: "oak", name: "Oak Wood", multiplier: 1.3, texture: "/placeholder.svg?height=60&width=60" },
  { id: "walnut", name: "Walnut Wood", multiplier: 1.6, texture: "/placeholder.svg?height=60&width=60" },
  { id: "mahogany", name: "Mahogany Wood", multiplier: 1.8, texture: "/placeholder.svg?height=60&width=60" },
  { id: "metal", name: "Metal Frame", multiplier: 1.2, texture: "/placeholder.svg?height=60&width=60" },
]

const colors = [
  { id: "natural", name: "Natural", hex: "#D4B896" },
  { id: "charcoal", name: "Charcoal", hex: "#36454F" },
  { id: "cream", name: "Cream", hex: "#F5F5DC" },
  { id: "navy", name: "Navy", hex: "#18395c" },
  { id: "burgundy", name: "Burgundy", hex: "#800020" },
  { id: "forest", name: "Forest Green", hex: "#355E3B" },
]

export default function CustomDesignPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<DesignFormData>({
    baseProduct: "",
    material: "",
    color: "",
    width: "",
    depth: "",
    height: "",
    notes: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const calculatePrice = () => {
    if (!formData.baseProduct) return 0

    const baseProduct = baseProducts.find((p) => p.id === formData.baseProduct)
    const material = materials.find((m) => m.id === formData.material)

    if (!baseProduct) return 0

    let price = baseProduct.basePrice
    if (material) price *= material.multiplier

    // Size multiplier
    const width = Number.parseFloat(formData.width) || 100
    const depth = Number.parseFloat(formData.depth) || 50
    const height = Number.parseFloat(formData.height) || 80
    const volume = width * depth * height
    const standardVolume = 100 * 50 * 80
    const sizeMultiplier = Math.max(0.8, Math.min(2.0, volume / standardVolume))

    price *= sizeMultiplier

    return Math.round(price)
  }

  const handleInputChange = (field: keyof DesignFormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Update price estimate
    if (
      field === "baseProduct" ||
      field === "material" ||
      field === "width" ||
      field === "depth" ||
      field === "height"
    ) {
      setTimeout(() => setEstimatedPrice(calculatePrice()), 100)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/") || file.type === "application/pdf"
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    setUploadedFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const submitFormData = new FormData()

      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value)
      })

      // Add files
      uploadedFiles.forEach((file) => {
        submitFormData.append("files", file)
      })

      const response = await fetch("/api/custom-design", {
        method: "POST",
        body: submitFormData,
      })

      const result = await response.json()

      if (result.success) {
        setSubmitSuccess(true)
        setEstimatedPrice(result.estimatedPrice)
      } else {
        alert("Failed to submit design request. Please try again.")
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.baseProduct !== ""
      case 2:
        return formData.material !== "" && formData.color !== ""
      case 3:
        return formData.width !== "" && formData.depth !== "" && formData.height !== ""
      case 4:
        return true // File upload is optional
      case 5:
        return true // Notes are optional
      case 6:
        return true // Price estimate step
      case 7:
        return formData.customerName !== "" && formData.customerEmail !== ""
      default:
        return false
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-32 pb-16">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Design Request Submitted!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your custom design request. Our team will review your specifications and contact you within
              24-48 hours.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Estimated Price</h3>
              <p className="text-3xl font-bold text-[#18395c]">EGP {estimatedPrice.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">*Final price may vary based on detailed specifications</p>
            </div>
            <Button onClick={() => (window.location.href = "/")} className="bg-[#18395c] hover:bg-[#18395c]/90">
              Return to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Design Your Dream Furniture</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Customize every detail — from size and material to color and finish. Create furniture that perfectly fits
            your space and style.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-[#18395c]" />
              Premium Materials
            </div>
            <div className="flex items-center">
              <Ruler className="w-5 h-5 mr-2 text-[#18395c]" />
              Custom Dimensions
            </div>
            <div className="flex items-center">
              <Palette className="w-5 h-5 mr-2 text-[#18395c]" />
              Unlimited Colors
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? "bg-[#18395c] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 7 && <div className={`w-12 h-1 mx-2 ${step < currentStep ? "bg-[#18395c]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600 text-center">Step {currentStep} of 7</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Steps */}
          <div className="lg:col-span-2">
            {/* Step 1: Select Base Product */}
            {currentStep === 1 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Base Product</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {baseProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          formData.baseProduct === product.id
                            ? "border-[#18395c] bg-[#18395c]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleInputChange("baseProduct", product.id)}
                      >
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">From EGP {product.basePrice.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Choose Material & Color */}
            {currentStep === 2 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Material & Color</h2>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Material</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            formData.material === material.id
                              ? "border-[#18395c] bg-[#18395c]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleInputChange("material", material.id)}
                        >
                          <Image
                            src={material.texture || "/placeholder.svg"}
                            alt={material.name}
                            width={60}
                            height={60}
                            className="w-full h-16 object-cover rounded mb-3"
                          />
                          <h4 className="font-medium text-gray-900">{material.name}</h4>
                          <p className="text-sm text-gray-500">+{Math.round((material.multiplier - 1) * 100)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Color</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {colors.map((color) => (
                        <div
                          key={color.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                            formData.color === color.id
                              ? "border-[#18395c] bg-[#18395c]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleInputChange("color", color.id)}
                        >
                          <div className="w-full h-12 rounded mb-2" style={{ backgroundColor: color.hex }} />
                          <p className="text-sm font-medium text-gray-900 text-center">{color.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Enter Dimensions */}
            {currentStep === 3 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Dimensions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="width" className="text-sm font-medium text-gray-700">
                        Width (cm)
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="100"
                        value={formData.width}
                        onChange={(e) => handleInputChange("width", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="depth" className="text-sm font-medium text-gray-700">
                        Depth (cm)
                      </Label>
                      <Input
                        id="depth"
                        type="number"
                        placeholder="50"
                        value={formData.depth}
                        onChange={(e) => handleInputChange("depth", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="80"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> These dimensions will be used as a starting point. Our designers will work
                      with you to refine the exact measurements.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Upload Images or Sketches */}
            {currentStep === 4 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Images or Sketches</h2>

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</p>
                    <p className="text-sm text-gray-500">Support for images and PDFs up to 10MB each</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-3">Uploaded Files</h3>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 5: Add Notes or Special Requests */}
            {currentStep === 5 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Notes or Special Requests</h2>
                  <Textarea
                    placeholder="Tell us about any specific requirements, style preferences, or special features you'd like to include..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This information helps our designers create the perfect piece for you.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Step 6: Price Estimate */}
            {currentStep === 6 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Estimate</h2>

                  <div className="bg-gradient-to-r from-[#18395c]/10 to-[#18395c]/5 rounded-lg p-6 mb-6">
                    <div className="text-center">
                      <p className="text-lg text-gray-600 mb-2">Estimated Price</p>
                      <p className="text-4xl font-bold text-[#18395c] mb-2">EGP {estimatedPrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">*Final price may vary based on detailed specifications</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Product:</span>
                      <span className="font-medium">
                        {baseProducts.find((p) => p.id === formData.baseProduct)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium">{materials.find((m) => m.id === formData.material)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">{colors.find((c) => c.id === formData.color)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">
                        {formData.width} × {formData.depth} × {formData.height} cm
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Contact Information */}
            {currentStep === 7 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="customerName"
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange("customerName", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 7 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNext()}
                  className="bg-[#18395c] hover:bg-[#18395c]/90"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext() || isSubmitting}
                  className="bg-[#18395c] hover:bg-[#18395c]/90"
                >
                  {isSubmitting ? "Submitting..." : "Submit Design Request"}
                </Button>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Preview
                  </h3>

                  {formData.baseProduct ? (
                    <div className="space-y-4">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image
                          src={
                            baseProducts.find((p) => p.id === formData.baseProduct)?.image ||
                            "/placeholder.svg?height=200&width=200&query=furniture preview"
                          }
                          alt="Preview"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium">
                            {baseProducts.find((p) => p.id === formData.baseProduct)?.name}
                          </span>
                        </div>

                        {formData.material && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Material:</span>
                            <span className="font-medium">
                              {materials.find((m) => m.id === formData.material)?.name}
                            </span>
                          </div>
                        )}

                        {formData.color && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Color:</span>
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: colors.find((c) => c.id === formData.color)?.hex }}
                              />
                              <span className="font-medium">{colors.find((c) => c.id === formData.color)?.name}</span>
                            </div>
                          </div>
                        )}

                        {(formData.width || formData.depth || formData.height) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium">
                              {formData.width || "?"} × {formData.depth || "?"} × {formData.height || "?"} cm
                            </span>
                          </div>
                        )}
                      </div>

                      {estimatedPrice > 0 && (
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Estimated Price:</span>
                            <span className="text-lg font-bold text-[#18395c]">
                              EGP {estimatedPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a product to see preview</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#18395c] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Vision</h3>
              <p className="text-gray-600">
                Tell us about your dream furniture piece through our detailed customization form.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#18395c] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Approve Design</h3>
              <p className="text-gray-600">Our designers create detailed plans and 3D renders for your approval.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#18395c] rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive Your Furniture</h3>
              <p className="text-gray-600">
                We craft your custom piece with premium materials and deliver it to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#18395c]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Your Perfect Furniture?</h2>
          <p className="text-xl text-white/90 mb-8">
            Start your custom design journey today and bring your vision to life.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            size="lg"
            className="bg-white text-[#18395c] hover:bg-gray-100"
          >
            Start Your Design
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
