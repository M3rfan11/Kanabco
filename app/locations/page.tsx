"use client"

import { MapPin, Phone, Clock, NavigationIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


interface StoreLocation {
  id: string
  name: string
  address: string
  phone: string
  hours: {
    weekdays: string
    friday: string
    weekend: string
  }
  features: string[]
  image: string
}

const locations: StoreLocation[] = [
  {
    id: "new-cairo",
    name: "New Cairo Showroom",
    address: "123 Design District, New Cairo, Egypt 11835",
    phone: "+20 2 1234 5678",
    hours: {
      weekdays: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 10:00 PM",
      weekend: "10:00 AM - 6:00 PM",
    },
    features: ["Full Furniture Collection", "Design Consultation", "Custom Orders", "Delivery Service"],
    image: "/placeholder.svg?height=300&width=400&text=New+Cairo+Showroom",
  },
  {
    id: "zamalek",
    name: "Zamalek Boutique",
    address: "45 Tahrir Street, Zamalek, Cairo, Egypt 11211",
    phone: "+20 2 2345 6789",
    hours: {
      weekdays: "10:00 AM - 9:00 PM",
      friday: "10:00 AM - 11:00 PM",
      weekend: "11:00 AM - 7:00 PM",
    },
    features: ["Curated Selection", "Interior Design", "Home Accessories", "Gift Wrapping"],
    image: "/placeholder.svg?height=300&width=400&text=Zamalek+Boutique",
  },
  {
    id: "alexandria",
    name: "Alexandria Branch",
    address: "78 Corniche Road, Alexandria, Egypt 21500",
    phone: "+20 3 3456 7890",
    hours: {
      weekdays: "9:30 AM - 8:30 PM",
      friday: "9:30 AM - 10:30 PM",
      weekend: "10:30 AM - 6:30 PM",
    },
    features: ["Coastal Collection", "Outdoor Furniture", "Design Services", "Local Delivery"],
    image: "/placeholder.svg?height=300&width=400&text=Alexandria+Branch",
  },
]

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-[#ed6b3e] ">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80 " />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">STORE LOCATIONS</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              Visit our showrooms to experience our furniture collections in person. Our design experts are ready to
              help you create your perfect space.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Store Locations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {locations.map((location) => (
            <div key={location.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Store Image */}
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                  src={location.image || "/placeholder.svg"}
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Store Details */}
              <div className="p-6">
                <h3 className="text-xl font-oblong font-bold text-gray-900 mb-4">{location.name}</h3>

                {/* Address */}
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-burnt-orange mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 font-gill-sans text-sm">{location.address}</p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-5 h-5 text-burnt-orange flex-shrink-0" />
                  <p className="text-gray-600 font-gill-sans text-sm">{location.phone}</p>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3 mb-6">
                  <Clock className="w-5 h-5 text-burnt-orange mt-0.5 flex-shrink-0" />
                  <div className="text-gray-600 font-gill-sans text-sm">
                    <p>Mon-Thu: {location.hours.weekdays}</p>
                    <p>Friday: {location.hours.friday}</p>
                    <p>Sat-Sun: {location.hours.weekend}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-gill-sans font-medium text-gray-900 mb-2">Available Services:</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-burnt-orange/10 text-burnt-orange text-xs font-gill-sans rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-burnt-orange text-white font-gill-sans font-medium hover:bg-burnt-orange/90"
                    size="sm"
                  >
                    <NavigationIcon className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-burnt-orange text-burnt-orange hover:bg-burnt-orange hover:text-white font-gill-sans font-medium bg-transparent"
                    size="sm"
                  >
                    Call Store
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-3xl font-oblong font-bold text-gray-900 mb-8 text-center">
            What to Expect at Our Stores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Expert Consultation",
                description: "Our design experts will help you find the perfect pieces for your space and style.",
              },
              {
                title: "Touch & Feel",
                description: "Experience the quality of our materials and craftsmanship firsthand.",
              },
              {
                title: "Custom Solutions",
                description: "Discuss custom orders and modifications to suit your specific needs.",
              },
              {
                title: "Delivery Planning",
                description: "Arrange delivery and installation services directly at the store.",
              },
            ].map((service, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-burnt-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-burnt-orange rounded-full"></div>
                </div>
                <h3 className="text-lg font-oblong font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 font-gill-sans text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-oblong font-bold text-gray-900 mb-4">Can't Visit a Store?</h2>
          <p className="text-gray-600 font-gill-sans mb-6 max-w-2xl mx-auto">
            No problem! Our team is available for virtual consultations and can help you shop our collections online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-burnt-orange text-white font-gill-sans font-semibold px-8 py-3 rounded-full hover:bg-burnt-orange/90">
              Schedule Virtual Consultation
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-gill-sans font-semibold px-8 py-3 rounded-full bg-transparent"
            >
              Shop Online
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
