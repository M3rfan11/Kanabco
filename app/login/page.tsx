"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Navigation from "../components/navigation"
import Footer from "../components/footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/checkout"
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Load Google OAuth script
  useEffect(() => {
    if (GOOGLE_CLIENT_ID && typeof window !== "undefined") {
      // Set global callback function
      window.handleGoogleSignIn = handleGoogleSignIn
      
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
          })
          window.google.accounts.id.renderButton(
            document.getElementById("g_id_signin"),
            {
              theme: "outline",
              size: "large",
              text: isSignUp ? "signup_with" : "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
            }
          )
        }
      }
      document.body.appendChild(script)
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
        delete window.handleGoogleSignIn
      }
    }
  }, [isSignUp])

  const handleGoogleSignIn = async (response: any) => {
    try {
      setLoading(true)
      setError("")
      
      // Send Google token to backend for verification and user creation/login
      const res = await fetch(`${API_BASE_URL}/api/Auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const token = data.accessToken || data.AccessToken
        
        if (token) {
          sessionStorage.setItem("authToken", token)
          router.push(redirectTo)
        } else {
          setError("Authentication failed. Please try again.")
        }
      } else {
        const errorData = await res.json()
        setError(errorData.message || "Google sign-in failed")
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      setError("Cannot connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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
        const token = data.accessToken || data.AccessToken
        
        if (token) {
          sessionStorage.setItem("authToken", token)
          router.push(redirectTo)
        } else {
          setError("Login successful but no token received. Please try again.")
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: "Invalid email or password" }))
        setError(errorData.message || "Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Cannot connect to server. Please make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate passwords match
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: signupForm.fullName,
          email: signupForm.email,
          password: signupForm.password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // After successful registration, automatically log in
        const loginRes = await fetch(`${API_BASE_URL}/api/Auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: signupForm.email,
            password: signupForm.password,
          }),
        })

        if (loginRes.ok) {
          const loginData = await loginRes.json()
          const token = loginData.accessToken || loginData.AccessToken
          
          if (token) {
            sessionStorage.setItem("authToken", token)
            router.push(redirectTo)
          } else {
            setError("Account created but login failed. Please try logging in.")
          }
        } else {
          setError("Account created successfully! Please log in.")
          setIsSignUp(false)
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: "Registration failed" }))
        setError(errorData.message || "Registration failed")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setError("Cannot connect to server. Please make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-md mx-auto px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <Image
                src="/assets/images/logoOB.png"
                alt="Kanabco Logo"
                width={120}
                height={60}
                className="mx-auto mb-4"
              />
            </Link>
            <h1 className="text-3xl font-oblong font-bold text-gray-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-600 font-gill-sans mt-2">
              {isSignUp 
                ? "Sign up to start shopping" 
                : "Sign in to continue to checkout"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-gill-sans">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          {GOOGLE_CLIENT_ID && (
            <div className="mb-6">
              <div id="g_id_onload" />
              <div
                id="g_id_signin"
                className="w-full"
                data-type="standard"
                data-size="large"
                data-theme="outline"
                data-text={isSignUp ? "signup_with" : "signin_with"}
                data-shape="rectangular"
                data-logo_alignment="left"
              />
            </div>
          )}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-gill-sans">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          {!isSignUp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-sm font-gill-sans">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-sm font-gill-sans">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold py-3 rounded-full"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-name" className="text-sm font-gill-sans">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  required
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-sm font-gill-sans">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-sm font-gill-sans">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-confirm" className="text-sm font-gill-sans">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  required
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ed6b3e] hover:bg-[#d55a2e] text-white font-gill-sans font-semibold py-3 rounded-full"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Toggle between Login and Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-gill-sans">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                }}
                className="text-[#ed6b3e] hover:text-[#d55a2e] font-semibold"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Continue as Guest */}
          {!isSignUp && (
            <div className="mt-6 text-center">
              <Link
                href="/collections"
                className="text-sm text-gray-600 hover:text-gray-900 font-gill-sans"
              >
                Continue shopping without account
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-gill-sans">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

// Extend Window interface for Google OAuth
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
          renderButton: (element: HTMLElement | null, config: any) => void
        }
      }
    }
    handleGoogleSignIn?: (response: any) => void
  }
}
