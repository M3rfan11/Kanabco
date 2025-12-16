"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Award, Users, Leaf, Heart } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[60vh] bg-[#ed6b3e]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-6">OUR STORY</h1>
            <p className="text-white/90 font-gill-sans text-xl leading-relaxed max-w-3xl">
              At Kanabco, we believe that furniture should be more than functional—it should inspire, comfort, and
              reflect your unique style. Since our founding, we&apos;ve been dedicated to creating pieces that transform
              houses into homes.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-oblong font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 font-gill-sans text-lg leading-relaxed mb-6">
                We&apos;re on a mission to make beautiful, sustainable furniture accessible to everyone. Every piece we
                create is thoughtfully designed with both form and function in mind, using materials that respect our
                planet and craftsmanship that stands the test of time.
              </p>
              <p className="text-gray-600 font-gill-sans text-lg leading-relaxed">
                From our modern seating collections to our innovative lighting solutions, we&apos;re committed to helping you
                create spaces that truly feel like home.
              </p>
            </div>
            <div className="relative h-96 bg-gray-200 rounded-2xl overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600&text=Modern+Workshop"
                alt="Kanabco workshop"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-oblong font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 font-gill-sans text-lg max-w-3xl mx-auto">
              These core principles guide everything we do, from design to delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: "Quality First",
                description:
                  "We never compromise on materials or craftsmanship. Every piece is built to last generations.",
              },
              {
                icon: Leaf,
                title: "Sustainability",
                description:
                  "Environmental responsibility is at the heart of our design process and material selection.",
              },
              {
                icon: Users,
                title: "Customer Focus",
                description: "Your satisfaction drives our innovation. We listen, learn, and continuously improve.",
              },
              {
                icon: Heart,
                title: "Passion",
                description: "We love what we do, and it shows in every detail of our furniture and service.",
              },
            ].map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-burnt-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-burnt-orange" />
                </div>
                <h3 className="text-xl font-oblong font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 font-gill-sans leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-oblong font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 font-gill-sans text-lg max-w-3xl mx-auto">
              The passionate individuals behind Kanabco&apos;s innovative designs and exceptional service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Ahmed",
                role: "Founder & Creative Director",
                image: "/placeholder.svg?height=300&width=300&text=Sarah+Ahmed",
              },
              {
                name: "Mohamed Hassan",
                role: "Head of Design",
                image: "/placeholder.svg?height=300&width=300&text=Mohamed+Hassan",
              },
              {
                name: "Layla Mansour",
                role: "Sustainability Manager",
                image: "/placeholder.svg?height=300&width=300&text=Layla+Mansour",
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-oblong font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-burnt-orange font-gill-sans font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-deep-navy py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-oblong font-bold text-white mb-6">Ready to Transform Your Space?</h2>
          <p className="text-white/90 font-gill-sans text-lg leading-relaxed mb-8">
            Discover our collections and find the perfect pieces to make your house feel like home.
          </p>
          <Button className="bg-burnt-orange text-white font-gill-sans font-semibold px-8 py-4 rounded-full text-lg hover:bg-burnt-orange/90 transition-colors">
            Shop Our Collections
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
