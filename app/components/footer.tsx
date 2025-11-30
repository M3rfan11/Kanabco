"use client"

import { Facebook, Instagram, Twitter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#18395c] text-white py-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Link href="/" className="mb-4">
            <Image
              src="/assets/images/logoOW.png" // Assuming this is your white logo
              alt="KANABCO Logo"
              width={150}
              height={93}
              className="object-contain"
            />
          </Link>
          <p className="text-sm font-gill-sans text-gray-300 leading-relaxed">
            Modern furniture for modern living.
            <br />
            Crafted with comfort, style, and durability in mind.
          </p>
        </div>

        {/* Quick Links */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-oblong font-bold mb-4 text-burnt-orange">QUICK LINKS</h3>
          <ul className="space-y-2 text-sm font-gill-sans text-gray-300">
            <li>
              <Link href="/shop" className="hover:text-white transition-colors">
                Shop All
              </Link>
            </li>
            <li>
              <Link href="/collections" className="hover:text-white transition-colors">
                Collections
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-oblong font-bold mb-4 text-burnt-orange">CUSTOMER SERVICE</h3>
          <ul className="space-y-2 text-sm font-gill-sans text-gray-300">
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="hover:text-white transition-colors">
                Shipping & Returns
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media & Newsletter */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-oblong font-bold mb-4 text-burnt-orange">CONNECT WITH US</h3>
          <div className="flex justify-center md:justify-start space-x-4 mb-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
          </div>
          <p className="text-sm font-gill-sans text-gray-300 mb-2">Sign up for our newsletter:</p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-grow px-4 py-2 rounded-full bg-white/10 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-burnt-orange"
            />
            <button
              type="submit"
              className="bg-burnt-orange text-white font-gill-sans font-semibold px-6 py-2 rounded-full text-sm hover:bg-burnt-orange/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm font-gill-sans text-gray-400">
        &copy; {new Date().getFullYear()} Kanabco. All rights reserved.
      </div>
    </footer>
  )
}
