import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const designData = {
      baseProduct: formData.get("baseProduct"),
      material: formData.get("material"),
      color: formData.get("color"),
      width: formData.get("width"),
      depth: formData.get("depth"),
      height: formData.get("height"),
      notes: formData.get("notes"),
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
    }

    // Handle file uploads
    const files = formData.getAll("files") as File[]
    const uploadedFiles = []

    for (const file of files) {
      if (file.size > 0) {
        // In a real implementation, you would upload to cloud storage
        // For now, we'll just store the file info
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }
    }

    // Calculate price estimate (simplified logic)
    const basePrice = getBasePrice(designData.baseProduct as string)
    const materialMultiplier = getMaterialMultiplier(designData.material as string)
    const sizeMultiplier = calculateSizeMultiplier(
      Number(designData.width),
      Number(designData.depth),
      Number(designData.height),
    )

    const estimatedPrice = Math.round(basePrice * materialMultiplier * sizeMultiplier)

    // Here you would typically save to database and send emails
    console.log("Design Request Received:", {
      ...designData,
      files: uploadedFiles,
      estimatedPrice,
    })

    return NextResponse.json({
      success: true,
      message: "Design request submitted successfully!",
      estimatedPrice,
      requestId: `CR-${Date.now()}`,
    })
  } catch (error) {
    console.error("Error processing design request:", error)
    return NextResponse.json({ success: false, message: "Failed to submit design request" }, { status: 500 })
  }
}

function getBasePrice(product: string): number {
  const basePrices: { [key: string]: number } = {
    sofa: 15000,
    chair: 8000,
    table: 12000,
    bed: 18000,
    cabinet: 10000,
    bookshelf: 9000,
  }
  return basePrices[product] || 10000
}

function getMaterialMultiplier(material: string): number {
  const multipliers: { [key: string]: number } = {
    fabric: 1.0,
    leather: 1.5,
    oak: 1.3,
    walnut: 1.6,
    mahogany: 1.8,
    metal: 1.2,
  }
  return multipliers[material] || 1.0
}

function calculateSizeMultiplier(width: number, depth: number, height: number): number {
  // Simple size-based pricing (larger = more expensive)
  const volume = (width || 100) * (depth || 50) * (height || 80)
  const standardVolume = 100 * 50 * 80 // Standard dimensions
  return Math.max(0.8, Math.min(2.0, volume / standardVolume))
}
