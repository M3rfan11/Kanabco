"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"


export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-[40vh] bg-[#ed6b3e]">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-navy to-deep-navy/80" />
        <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-oblong font-bold text-white mb-4">CONTACT US</h1>
            <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl">
              We're here to help! Whether you have questions about our products, need design advice, or want to discuss
              a custom order, our team is ready to assist you.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Get in Touch</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-gill-sans font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-gill-sans font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-gill-sans font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-gill-sans font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                >
                  <option value="">Select a subject</option>
                  <option value="product-inquiry">Product Inquiry</option>
                  <option value="order-support">Order Support</option>
                  <option value="design-consultation">Design Consultation</option>
                  <option value="custom-order">Custom Order</option>
                  <option value="warranty">Warranty Claim</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-gill-sans font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-gill-sans focus:outline-none focus:ring-1 focus:ring-burnt-orange resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <Button
                type="submit"
                className="w-full py-4 rounded-full text-white font-gill-sans font-semibold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: "#18395c" }}
              >
                <Send className="w-5 h-5" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-oblong font-bold text-gray-900 mb-8">Contact Information</h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-burnt-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-burnt-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-oblong font-bold text-gray-900 mb-2">Visit Our Showroom</h3>
                  <p className="text-gray-600 font-gill-sans leading-relaxed">
                    123 Design District
                    <br />
                    New Cairo, Egypt 11835
                    <br />
                    Near Cairo Festival City
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-burnt-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-burnt-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-oblong font-bold text-gray-900 mb-2">Call Us</h3>
                  <p className="text-gray-600 font-gill-sans leading-relaxed">
                    +20 2 1234 5678
                    <br />
                    +20 100 123 4567 (WhatsApp)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-burnt-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-burnt-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-oblong font-bold text-gray-900 mb-2">Email Us</h3>
                  <p className="text-gray-600 font-gill-sans leading-relaxed">
                    info@kanabco.com
                    <br />
                    support@kanabco.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-burnt-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-burnt-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-oblong font-bold text-gray-900 mb-2">Business Hours</h3>
                  <div className="text-gray-600 font-gill-sans leading-relaxed">
                    <p>Monday - Thursday: 9:00 AM - 8:00 PM</p>
                    <p>Friday - Saturday: 9:00 AM - 10:00 PM</p>
                    <p>Sunday: 10:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
