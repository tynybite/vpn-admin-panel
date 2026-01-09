"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Eye, EyeOff, Loader2, ArrowLeft, Lock, Fingerprint } from "lucide-react"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const user = await authService.signIn(email, password)

      if (user.role === "admin") {
        toast.success("Welcome back!", {
          description: "You have successfully signed in.",
        })
        router.push("/dashboard")
      } else {
        toast.success("Welcome!", {
          description: "You have successfully signed in.",
        })
        router.push("/user-dashboard")
      }

      toast.success("Welcome back!", {
        description: "You have successfully signed in.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      let message = "Invalid email or password. Please try again."

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = "Invalid email or password."
      } else if (err.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later."
      }

      toast.error("Login Failed", {
        description: message,
      })
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")
    try {
      const user = await authService.signInWithGoogle()

      if (user.role === "admin") {
        toast.success("Welcome back!", {
          description: "You have successfully signed in with Google.",
        })
        router.push("/dashboard")
      } else {
        toast.success("Welcome!", {
          description: "You have successfully signed in with Google.",
        })
        router.push("/user-dashboard")
      }

      toast.success("Welcome back!", {
        description: "You have successfully signed in with Google.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Google login error:", err)

      if (err.message && err.message.includes("Access Restricted")) {
        toast.error("Login Failed", {
          description: err.message,
        })
      } else if (err.code === 'auth/popup-blocked') {
        toast.error("Login Failed", {
          description: "Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.",
        })
      } else {
        toast.error("Login Failed", {
          description: "Failed to sign in with Google. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex cyber-mesh-dark cyber-scanlines relative overflow-hidden">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-[100px] animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(0, 255, 229, 0.4) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-[80px] animate-float animation-delay-500"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
            bottom: '10%',
            left: '-5%',
          }}
        />
        <div 
          className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-[60px]"
          style={{
            background: 'radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00FFE5] rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              opacity: 0.3 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to home</span>
          </Link>
        </div>

        <div className="space-y-8">
          {/* Logo */}
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/20 to-[#8B5CF6]/20 rounded-2xl rotate-12 animate-pulse-glow" />
            <div className="absolute inset-1 bg-[#16161D] rounded-xl rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-10 h-10 text-[#00FFE5] drop-shadow-[0_0_20px_rgba(0,255,229,0.5)]" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Enter The
              <br />
              <span className="cyber-gradient-text">CyberVault</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-md">
              Access the control center. Manage servers, monitor connections, and secure your network.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 pt-8">
            {[
              { icon: Lock, text: "End-to-end encrypted" },
              { icon: Fingerprint, text: "Biometric authentication" },
              { icon: Shield, text: "Enterprise-grade security" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-500">
                <div className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-[#00FFE5]" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Velocity VPN. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Back Link */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to home</span>
          </Link>

          {/* Card */}
          <div className="bg-[#16161D]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              {/* Mobile Logo */}
              <div className="lg:hidden mx-auto w-16 h-16 relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/20 to-[#8B5CF6]/20 rounded-xl rotate-12" />
                <div className="absolute inset-1 bg-[#16161D] rounded-lg rotate-12" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#00FFE5]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400 text-sm">Sign in to access your dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg text-[#FF6B6B] text-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">!</span>
                </div>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@cloudvpn.com"
                  required
                  className="h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-[#00FFE5] focus:ring-[#00FFE5]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-[#00FFE5] focus:ring-[#00FFE5]/20 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="border-gray-700 data-[state=checked]:bg-[#00FFE5] data-[state=checked]:border-[#00FFE5]" />
                  <label htmlFor="remember" className="text-sm text-gray-400">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-[#00FFE5] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#00FFE5] text-[#0A0A0F] hover:bg-[#00FFE5]/90 font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,229,0.3)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#16161D] px-3 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-12 bg-transparent border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:border-gray-700"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.54z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm">
            Protected by enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  )
}
