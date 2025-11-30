"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"

interface Collection {
  id: string
  name: string
  description: string
  image: string
  href: string
  productCount: number
  badge?: string
}

const collections: Collection[] = [
  {
    id: "seating",
    name: "SEATING",
    description: "Be comfortable. Seat at home!",
    image: "/placeholder.svg?height=400&width=600&text=Seating+Collection",
    href: "/collections/seating",
    productCount: 24,
  },
  {
    id: "sofas",
    name: "SOFAS",
    description: "Create the perfect lounge area!",
    image: "/placeholder.svg?height=400&width=600&text=Sofas+Collection",
    href: "/collections/sofas",
    productCount: 18,
  },
  {
    id: "rooms",
    name: "ROOMS",
    description: "Complete room solutions for modern living!",
    image: "/placeholder.svg?height=400&width=600&text=Rooms+Collection",
    href: "/collections/rooms",
    productCount: 12,
  },
  {
    id: "tables",
    name: "TABLES",
    description: "Surfaces that define your space!",
    image: "/placeholder.svg?height=400&width=600&text=Tables+Collection",
    href: "/collections/tables",
    productCount: 32,
  },
  {
    id: "home-decors",
    name: "HOME DECORS",
    description: "Touches that add character!",
    image: "/placeholder.svg?height=400&width=600&text=Home+Decors+Collection",
    href: "/collections/home-decors",
    productCount: 45,
  },
  {
    id: "new-arrivals",
    name: "NEW ARRIVALS",
    description: "Fresh designs for modern spaces!",
    image: "/placeholder.svg?height=400&width=600&text=New+Arrivals+Collection",
    href: "/collections/new-arrivals",
    productCount: 16,
    badge: "New",
  },
  {
    id: "best-selling",
    name: "BEST SELLING",
    description: "Customer favorites and top picks!",
    image: "/placeholder.svg?height=400&width=600&text=Best+Selling+Collection",
    href: "/collections/best-selling",
    productCount: 20,
    badge: "Popular",
  },
]

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[50vh] bg-[#18395c]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">OUR COLLECTIONS</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Discover our curated collections of modern furniture designed to transform your living space with comfort,
              style, and durability. Each collection tells a unique story of craftsmanship and design excellence.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Link key={collection.id} href={collection.href}>
              <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                {/* Badge */}
                {collection.badge && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-burnt-orange text-white text-sm px-3 py-1 rounded-full font-gill-sans font-medium">
                      {collection.badge}
                    </span>
                  </div>
                )}

                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-oblong font-bold mb-2 tracking-wide">{collection.name}</h3>
                  <p className="text-white/90 font-gill-sans text-sm mb-3 leading-relaxed">{collection.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-gill-sans text-sm">{collection.productCount} Products</span>
                    <div className="flex items-center text-white group-hover:text-burnt-orange transition-colors">
                      <span className="font-gill-sans text-sm mr-2">Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-burnt-orange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl md:text-4xl font-oblong font-bold text-gray-900 mb-4">Why Choose Kanabco?</h2>
          <p className="text-gray-600 font-gill-sans text-lg max-w-3xl mx-auto mb-12">
            Each collection represents our commitment to quality, sustainability, and timeless design that adapts to
            your evolving lifestyle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Quality Craftsmanship",
                description: "Every piece is meticulously crafted using premium materials and time-tested techniques.",
              },
              {
                title: "Sustainable Design",
                description: "We prioritize eco-friendly materials and processes in all our collections.",
              },
              {
                title: "Timeless Style",
                description: "Our designs transcend trends, ensuring your furniture remains stylish for years to come.",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-burnt-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-burnt-orange rounded-full"></div>
                </div>
                <h3 className="text-xl font-oblong font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 font-gill-sans leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
