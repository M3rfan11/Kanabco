"use client"

import { Search, User, ShoppingCart, ChevronDown, ArrowRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "../contexts/CartContext"

export default function Navigation() {
  const { getCartItemCount } = useCart()
  const [isFixed, setIsFixed] = useState(false)
  const [showProductsDropdown, setShowProductsDropdown] = useState(false)


    const hideTimeout = useRef<NodeJS.Timeout | null>(null)
    const handleMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    setShowProductsDropdown(true)
  }

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setShowProductsDropdown(false)
    }, 300)  }


  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight
      const collectionsStart = heroHeight
      const navHeight = 80
      setIsFixed(window.scrollY > collectionsStart + navHeight)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const productCategories = [
    { name: "SEATING", href: "/collections/seating" },
    { name: "SOFAS", href: "/collections/sofas" },
    { name: "ROOMS", href: "/collections/rooms" },
    { name: "TABLES", href: "/collections/tables" },
    { name: "HOME DECORS", href: "/collections/home-decors" },
    { name: "New Arrivals", href: "/collections/new-arrivals" },
    { name: "Best Selling", href: "/collections/best-selling" },
  ]

  const featuredProducts = [
    {
      title: "SOFAS",
      subtitle: "View the Collection",
      image: "/assets/images/hero2.jpg",
      badge: null,
      href: "/collections/sofas",
    },
    {
      title: "SEATING",
      subtitle: "View the Collection",
      image: "/assets/images/Chair.jpg",
      badge: "New Colors",
      href: "/collections/seating",
    },
    {
      title: "NEW ARRIVALS",
      subtitle: "View the Collection",
      image: "/assets/images/fabric.jpg",
      badge: null,
      href: "/collections/new-arrivals",
    },
  ]

  return (
    <div
      className={`w-full ${isFixed ? "fixed top-0 left-0 right-0 z-[1000] shadow-sm " : "relative "}`}
    >
      <div className="relative ">
        {/* Navbar */}
        <nav className="w-full bg-gray-50 backdrop-blur-sm border-b border-gray-200 py-4 px-6 transition-all duration-300 rounded-t-[3rem]">
          <div className="relative px-16 mx-auto flex items-center justify-between">
            {/* Left Navigation */}
            <div className="flex items-center space-x-2">
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                
                <button
                  className={`px-6 py-2 z-10 relative rounded-full font-medium tracking-wide transition-colors ${
                    showProductsDropdown ? "bg-[#18395c] text-white" : "text-[#18395c]"
                  }`}
                >
                  PRODUCTS
                </button>
              </div>
              <Link href="/custom-design">
              <button className="px-4 py-2 rounded-full text-[#18395c] hover:bg-[#18395c] hover:text-white font-gill-sans font-medium tracking-wide transition-colors">
                DESIGN
              </button>
              </Link>
              <Link href="/about">
              <button className="px-4 py-2 rounded-full text-[#18395c] hover:bg-[#18395c] hover:text-white font-gill-sans font-medium tracking-wide transition-colors">
                OUR STORY
              </button>
              </Link>
              <Link href="/contact">
              <button className="px-4 py-2 rounded-full text-[#18395c] hover:bg-[#18395c] hover:text-white font-gill-sans font-medium tracking-wide transition-colors">
                CONTACT US
              </button>
              </Link>
            </div>

            {/* Center Logo */}
            <Link href="/">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Image
                src="/assets/images/logoOB.png"
                alt="KANABCO Logo"
                width={120}
                height={60}
                className="object-contain"
              />
            </div>
            </Link>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 font-gill-sans">EGP</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <Link href="/account">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
              </Link>
              <Link href="/cart">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ed6b3e] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartItemCount() > 99 ? "99+" : getCartItemCount()}
                  </span>
                )}
              </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Dropdown */}
        <div
          className={`absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-[1000] transition-all duration-500 ease-out ${
            showProductsDropdown ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`flex max-w-7xl mx-auto transition-transform duration-500 ease-out ${
              showProductsDropdown ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Left Sidebar */}
            <div className="w-80 p-8 border-r border-gray-100">
              <div className="space-y-6">
                {productCategories.map((category, index) => (
                  <div
                    key={category.name}
                    className={`transition-all duration-500 ease-out ${
                      showProductsDropdown ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <Link href={category.href}>
                      <button className="block w-full text-left text-gray-600 hover:text-[#8B6B47] transition-colors font-medium text-lg">
                        {category.name}
                      </button>
                    </Link>
                  </div>
                ))}

                <div className="pt-6 border-t border-gray-200">
                  <div
                    className={`transition-all duration-500 ease-out ${
                      showProductsDropdown
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-8 opacity-0"
                    }`}
                    style={{ transitionDelay: "500ms" }}
                  >
                    <Link href="/collections">
                    <button className="flex items-center justify-between w-full text-left text-gray-600 hover:text-[#8B6B47] transition-colors font-medium text-lg">
                      View All Products
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-8">
              <div className="grid grid-cols-3 gap-8">
                {featuredProducts.map((product, index) => (
                  <Link href={product.href} key={product.title}>
                  <div
                    key={product.title}
                    className={`group cursor-pointer transition-all duration-500 ease-out ${
                      showProductsDropdown
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-12 opacity-0"
                    }`}
                    style={{ transitionDelay: `${(index + 2) * 150}ms` }}
                  >
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      {product.badge && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                            {product.badge}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-6 left-6 right-6 z-10">
                        <h3 className="text-white text-2xl font-bold mb-2 tracking-wide">{product.title}</h3>
                        <div className="flex items-center text-white/90 group-hover:text-white transition-colors">
                          <span className="text-sm">{product.subtitle}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={350}
                        height={400}
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
