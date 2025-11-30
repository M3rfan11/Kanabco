"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"



export default function CollectionsSection() {
  return (
    <div className="relative z-10 bg-gray-50">
  

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-oblong font-bold text-[#ed6b3e] tracking-wide" style={{ fontFamily: 'Oblong, sans-serif' }}>
              LOVE WHERE YOU LIVE
            </h2>
            
          </div>

          <Link href="/collections">
            <Button

              variant="outline"
              className="border-[#ed6b3e] text-[#ed6b3e] hover:border-[#18395c] hover:text-[#18395c] font-gill-sans tracking-wide px-6 py-2 rounded-full bg-transparent"
            >
              VIEW ALL COLLECTIONS
            </Button>
          </Link>
 


        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Seating - Large Card */}
          <div className="lg:col-span-2 lg:row-span-2 relative group overflow-hidden rounded-2xl bg-blue-100">
            <Image
              src="/assets/images/Chair.jpg" // Replace with actual seating image path
              alt="Modern chair"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-3xl font-oblong font-bold mb-2 text-white">
                SEATING
              </h3>
              <p className="text-sm font-gill-sans mb-4 text-white" >
                Be comfortable. Seat at home
              </p>
              <button className="flex items-center space-x-2 text-[#ed6b3e] hover:text-[#ed6b3e]/80 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sofas */}
          <div className="lg:col-span-2 relative group overflow-hidden rounded-2xl bg-amber-50">
            <Image
              src="/assets/images/hero2.jpg" // Replace with actual sofa image path
              alt="Modern sofa"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-2xl font-oblong font-bold mb-2 text-white" >
                SOFAS
              </h3>
              <p className="text-sm font-gill-sans mb-4 text-white" >
                Create the perfect lounge area
              </p>
              <button className="flex items-center space-x-2 text-[#ed6b3e] hover:text-[#ed6b3e]/80 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tables */}
          <div className="relative group overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src="/assets/images/bc.jpg" // Replace with actual table image path
              alt="Pendant light"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-xl font-oblong font-bold mb-2 text-white" >
                Tables
              </h3>
              <p className="text-sm font-gill-sans mb-4 text-white">
                Surfaces that define your space
              </p>
              <button className="flex items-center space-x-2 text-[#ed6b3e] hover:text-[#ed6b3e]/80 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Home Decors */}
          <div className="relative group overflow-hidden rounded-2xl bg-green-50">
            <Image
              src="/assets/images/fabric.jpg" // Replace with actual home decor image path
              alt="Home accessories"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-xl font-oblong font-bold mb-2 text-white">
                Home Decors
              </h3>
              <p className="text-sm font-gill-sans mb-4 text-white" >
                Pieces that complete your home
              </p>
              <button className="flex items-center space-x-2 text-[#ed6b3e] hover:text-[#ed6b3e]/80 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
