"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Globe, Lock, Zap, Users, Smartphone, Check, ArrowRight, Terminal, Eye, Fingerprint } from "lucide-react"

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.hasAttribute("data-feature-index")) {
            const index = Number.parseInt(entry.target.getAttribute("data-feature-index") || "0")
            setVisibleFeatures((prev) => {
              const updated = [...prev]
              updated[index] = true
              return updated
            })
          }
        })
      },
      { threshold: 0.2 },
    )

    const featureCards = document.querySelectorAll("[data-feature-index]")
    featureCards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════
          HERO SECTION - CyberVault Aesthetic
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden cyber-mesh-dark cyber-scanlines"
      >
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 229, 0.4) 0%, transparent 70%)',
              top: '10%',
              left: '-10%',
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[80px] animate-float animation-delay-500"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
              top: '40%',
              right: '-5%',
              transform: `translateY(${scrollY * -0.05}px)`,
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[60px]"
            style={{
              background: 'radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, transparent 70%)',
              bottom: '10%',
              left: '30%',
            }}
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#00FFE5] rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center min-h-screen py-24">
            
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              {/* Status Badge */}
              <div className="animate-reveal animation-fill-backwards">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00FFE5]/30 bg-[#00FFE5]/5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFE5] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFE5]"></span>
                  </span>
                  <span className="text-[#00FFE5] text-sm font-medium tracking-wide">500K+ SECURED CONNECTIONS</span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight animate-reveal animation-delay-100 animation-fill-backwards">
                  Enter The
                  <br />
                  <span className="cyber-gradient-text animate-glitch inline-block">CyberVault</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed animate-reveal animation-delay-200 animation-fill-backwards">
                  Military-grade encryption meets seamless connectivity. Your data travels through an impenetrable digital fortress spanning 50+ countries.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-reveal animation-delay-300 animation-fill-backwards">
                <a href="https://play.google.com/store/apps/details?id=labs.tynybite.supervpn" target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="group relative bg-[#00FFE5] text-[#0A0A0F] hover:bg-[#00FFE5]/90 font-semibold text-base px-8 py-6 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,229,0.4)]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Download App
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </a>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:border-[#00FFE5] hover:text-[#00FFE5] bg-transparent font-medium text-base px-8 py-6 rounded-lg transition-all duration-300"
                  >
                    Dashboard
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4 animate-reveal animation-delay-400 animation-fill-backwards">
                {[
                  { icon: Lock, label: 'Zero-Log Policy' },
                  { icon: Zap, label: '99.9% Uptime' },
                  { icon: Shield, label: 'AES-256 Encrypted' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-500">
                    <item.icon className="w-4 h-4 text-[#00FFE5]" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Shield Visualization */}
            <div className="relative flex items-center justify-center animate-slide-in-right animation-delay-200 animation-fill-backwards">
              {/* Orbiting Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] border border-[#00FFE5]/10 rounded-full animate-[spin_30s_linear_infinite]">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#00FFE5] rounded-full shadow-[0_0_20px_rgba(0,255,229,0.5)]" />
                </div>
                <div className="absolute w-[220px] h-[220px] md:w-[300px] md:h-[300px] border border-[#8B5CF6]/10 rounded-full animate-[spin_20s_linear_infinite_reverse]">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#8B5CF6] rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                </div>
                <div className="absolute w-[140px] h-[140px] md:w-[200px] md:h-[200px] border border-[#FF6B6B]/10 rounded-full animate-[spin_15s_linear_infinite]">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FF6B6B] rounded-full shadow-[0_0_10px_rgba(255,107,107,0.5)]" />
                </div>
              </div>

              {/* Central Shield */}
              <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/20 to-[#8B5CF6]/20 rounded-3xl rotate-45 animate-pulse-glow" />
                <div className="absolute inset-2 bg-[#16161D] rounded-2xl rotate-45" />
                <Shield className="relative w-16 h-16 md:w-20 md:h-20 text-[#00FFE5] drop-shadow-[0_0_30px_rgba(0,255,229,0.5)]" />
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -bottom-4 -left-4 md:left-0 p-4 bg-[#16161D]/80 backdrop-blur-xl border border-gray-800 rounded-xl animate-float animation-delay-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00FFE5]/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#00FFE5]" />
                  </div>
                  <div>
                    <div className="text-white font-bold">150+</div>
                    <div className="text-gray-500 text-xs">Servers Online</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 md:right-0 p-4 bg-[#16161D]/80 backdrop-blur-xl border border-gray-800 rounded-xl animate-float animation-delay-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <div className="text-white font-bold">500K+</div>
                    <div className="text-gray-500 text-xs">Active Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gray-500 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 border border-gray-700 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-[#00FFE5] rounded-full mt-1.5 animate-[bounce_2s_infinite]" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          FEATURES SECTION - Bento Grid
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={featuresRef} className="py-32 bg-[#0A0A0F] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 mb-6">
              <Terminal className="w-4 h-4 text-[#00FFE5]" />
              <span className="text-gray-400 text-sm font-medium">SECURITY PROTOCOLS</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Enterprise Arsenal
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Military-grade protection with consumer-grade simplicity
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "AES-256 Encryption",
                description: "The same encryption standard used by governments and military organizations worldwide. Unbreakable by design.",
                color: "#00FFE5",
                size: "lg",
              },
              {
                icon: Globe,
                title: "50+ Countries",
                description: "Lightning-fast servers strategically positioned across the globe for optimal performance.",
                color: "#8B5CF6",
                size: "md",
              },
              {
                icon: Eye,
                title: "Zero-Log Policy",
                description: "We don't track, collect, or share your data. Ever. Your privacy is non-negotiable.",
                color: "#FF6B6B",
                size: "md",
              },
              {
                icon: Zap,
                title: "Unlimited Speed",
                description: "No throttling, no data caps. Stream, game, and download at maximum velocity.",
                color: "#00FFE5",
                size: "md",
              },
              {
                icon: Fingerprint,
                title: "Multi-Device",
                description: "Protect up to 10 devices simultaneously with a single subscription.",
                color: "#8B5CF6",
                size: "md",
              },
              {
                icon: Smartphone,
                title: "One-Tap Connect",
                description: "Intelligent server selection gets you connected in milliseconds.",
                color: "#FF6B6B",
                size: "lg",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                data-feature-index={index}
                className={`group relative overflow-hidden border-gray-800/50 bg-gray-900/30 backdrop-blur-sm hover:border-gray-700 transition-all duration-500 ${
                  visibleFeatures[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                } ${feature.size === "lg" ? "md:col-span-2 lg:col-span-1" : ""}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Hover Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.color}10, transparent 40%)`,
                  }}
                />
                
                <CardContent className="relative p-8 space-y-6">
                  {/* Icon */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${feature.color}20, transparent)`,
                      border: `1px solid ${feature.color}30`,
                    }}
                  >
                    <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Corner Accent */}
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 opacity-10"
                    style={{
                      background: `linear-gradient(225deg, ${feature.color}, transparent)`,
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          APP SHOWCASE SECTION - Diagonal Layout
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-[#0D0D12] relative overflow-hidden">
        {/* Diagonal Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFE5]/5 via-transparent to-[#8B5CF6]/5" />
          <div 
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.01) 100px, rgba(255,255,255,0.01) 101px)',
            }}
          />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div className="space-y-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 mb-6">
                  <Smartphone className="w-4 h-4 text-[#FF6B6B]" />
                  <span className="text-gray-400 text-sm font-medium">MOBILE APP</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Protection at Your
                  <br />
                  <span className="cyber-gradient-text">Fingertips</span>
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Our intuitive mobile app delivers complete security control with a single tap. Available on iOS and Android.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-6">
                {[
                  { icon: Zap, label: "Instant Connect", desc: "One-tap to the fastest server" },
                  { icon: Globe, label: "Global Access", desc: "Bypass geo-restrictions anywhere" },
                  { icon: Lock, label: "Kill Switch", desc: "Auto-protect on connection drop" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center flex-shrink-0 group-hover:border-[#00FFE5]/30 transition-colors">
                      <item.icon className="w-5 h-5 text-[#00FFE5]" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{item.label}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* App Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-[#FFD700] text-lg">★</span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">4.8 Rating</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500K+</div>
                  <span className="text-gray-400 text-sm">Downloads</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <span className="text-gray-400 text-sm">Uptime</span>
                </div>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex items-center justify-center">
              {/* Glow Background */}
              <div className="absolute w-[400px] h-[400px] bg-[#00FFE5]/10 rounded-full blur-[100px]" />
              
              {/* Phone Frame */}
              <div className="relative z-10 w-[280px] md:w-[320px]">
                <div className="relative bg-[#1A1A24] rounded-[3rem] p-3 shadow-2xl border border-gray-800">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0A0A0F] rounded-full" />
                  <div className="bg-[#0A0A0F] rounded-[2.4rem] overflow-hidden aspect-[9/19.5]">
                    <img
                      src="/modern-vpn-mobile-app-interface.jpg"
                      alt="Velocity VPN "
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-4 top-20 p-3 bg-[#16161D] border border-gray-800 rounded-xl shadow-xl animate-float animation-delay-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PRICING SECTION
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-[#0A0A0F] relative">
        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Choose Your <span className="cyber-gradient-text">Shield</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple, transparent pricing. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: ["10 server locations", "Basic speed", "1 device", "Standard support", "Ad-supported"],
                cta: "Get Started",
                popular: false,
                color: "#6B7280",
              },
              {
                name: "Premium",
                price: "$9.99",
                period: "month",
                features: [
                  "150+ premium servers",
                  "Unlimited speed",
                  "10 devices",
                  "Priority support",
                  "Ad-free experience",
                  "Kill switch",
                  "Split tunneling",
                ],
                cta: "Start Free Trial",
                popular: true,
                color: "#00FFE5",
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "contact us",
                features: ["Dedicated servers", "Custom integrations", "Unlimited devices", "24/7 VIP support", "Advanced analytics", "SLA guarantee"],
                cta: "Contact Sales",
                popular: false,
                color: "#8B5CF6",
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden border-gray-800 bg-gray-900/30 backdrop-blur-sm transition-all duration-300 ${
                  plan.popular 
                    ? "md:scale-110 border-[#00FFE5]/50 shadow-[0_0_50px_rgba(0,255,229,0.1)]" 
                    : "hover:border-gray-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00FFE5] via-[#8B5CF6] to-[#FF6B6B]" />
                )}

                <CardContent className="p-8 space-y-6">
                  {/* Plan Name */}
                  <div>
                    {plan.popular && (
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-[#00FFE5] bg-[#00FFE5]/10 rounded-full mb-3">
                        MOST POPULAR
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 pt-4 border-t border-gray-800">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="h-5 w-5 flex-shrink-0" style={{ color: plan.color }} />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full py-6 font-semibold transition-all duration-300 ${
                      plan.popular 
                        ? "bg-[#00FFE5] text-[#0A0A0F] hover:bg-[#00FFE5]/90 hover:shadow-[0_0_30px_rgba(0,255,229,0.3)]" 
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#08080C] border-t border-gray-800/50">
        <div className="container mx-auto px-6 lg:px-12 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold cyber-gradient-text">Velocity VPN</h3>
              <p className="text-gray-500 leading-relaxed">
                Securing your digital freedom with military-grade encryption.
              </p>
              <div className="flex gap-4 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center hover:border-[#00FFE5]/30 transition-colors cursor-pointer">
                    <div className="w-4 h-4 rounded-sm bg-gray-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Download", "Changelog"],
              },
              {
                title: "Support",
                links: ["Help Center", "Contact Us", "System Status", "FAQ"],
              },
              {
                title: "Legal",
                links: [
                  { text: "Privacy Policy", href: "#" },
                  { text: "Terms of Service", href: "#" },
                  { text: "Delete Account", href: "/delete-account", className: "hover:text-red-400" },
                  { text: "Admin", href: "/login", className: "hover:text-[#00FFE5]" },
                ],
              },
            ].map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      {typeof link === "string" ? (
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
                          {link}
                        </a>
                      ) : (
                        <Link href={link.href} className={`text-gray-500 transition-colors text-sm ${link.className || "hover:text-white"}`}>
                          {link.text}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Velocity VPN. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
