"use client"

import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Hash, Layout, Globe, Server, Terminal, Copy, Check, ChevronRight,
    Book, Key, Shield, Zap, Search, Activity, Settings, User, FileText, Smartphone,
    DollarSign, Palette, Bell, Menu, Database, Cloud, Lock, Wifi, Rocket, Code, Hammer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
// removed ScrollArea import as it is no longer used in the main page layout, but used in content components if needed? 
// Actually it might be useful inside content, but standard scroll is better for main page.

type DocSection = {
    id: string
    title: string
    icon: any
    content: React.ReactNode
}

import { useSearchParams } from "next/navigation"

function DocsContent() {
    const searchParams = useSearchParams()
    const activeSection = searchParams.get("section") || "overview"

    // Flatten sections for easy lookup
    const sections: Record<string, DocSection[]> = {
        "General": [
            { id: "overview", title: "System Overview", icon: Globe, content: <OverviewContent /> },
            { id: "architecture", title: "Architecture", icon: Cloud, content: <ArchitectureContent /> },
            { id: "auth-flow", title: "Authentication Flows", icon: Lock, content: <AuthFlowContent /> },
            { id: "deployment", title: "Deployment & Setup", icon: Rocket, content: <DeploymentContent /> },
        ],
        "Configuration": [
            { id: "config-system", title: "Config System", icon: Settings, content: <ConfigSystemContent /> },
            { id: "monetization", title: "Ads & Pricing", icon: DollarSign, content: <MonetizationContent /> },
        ],
        "References": [
            { id: "mobile-api", title: "Mobile API", icon: Smartphone, content: <MobileApiContent /> },
            { id: "admin-api", title: "Admin API", icon: Terminal, content: <AdminApiContent /> },
        ]
    }

    const flatSections = Object.values(sections).flat()
    const activeDoc = flatSections.find(s => s.id === activeSection) || flatSections[0]

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-8">
            {/* Page Header */}
            <div className="flex items-center gap-3 border-b pb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <activeDoc.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        {activeDoc.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Developer Hub / {activeSection}
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-w-0 animate-fade-in">
                <Card className="border-0 shadow-none bg-transparent">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeDoc.content}
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    )
}

export default function DocsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8">Loading documentation...</div>}>
            <DocsContent />
        </Suspense>
    )
}

// --- CONTENT COMPONENTS ---

function DeploymentContent() {
    return (
        <div className="space-y-10 max-w-4xl">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="lead text-xl text-muted-foreground">
                    Complete guide to deploying the Admin Panel and setting up the backend infrastructure.
                </p>
            </div>

            <div className="space-y-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
                        Firebase Setup
                    </h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Prerequisites</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>1. Create a new project at <a href="https://console.firebase.google.com" className="text-primary hover:underline">console.firebase.google.com</a>.</p>
                            <p>2. Enable <strong>Authentication</strong> (Email/Password, Google).</p>
                            <p>3. Enable <strong>Firestore Database</strong> (Create in production mode).</p>
                            <p>4. Enable <strong>Storage</strong> for OVPN file hosting.</p>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
                        Environment Variables
                    </h2>
                    <div className="bg-muted px-4 py-2 rounded-lg border font-mono text-sm mb-4">
                        cp .env.example .env.local
                    </div>
                    <p className="text-sm text-muted-foreground">Populate these values in <code>.env.local</code>:</p>

                    <div className="bg-muted/50 p-4 rounded-xl border font-mono text-xs overflow-x-auto">
                        {`# Client-side Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin SDK (Service Account)
# Generate from Firebase Console -> Project Settings -> Service Accounts -> Generate Private Key
FIREBASE_ADMIN_KEY={"type":"service_account",...}

# Security
JWT_SECRET=... # 32-byte hex string
ENCRYPTION_KEY=... # 32-byte hex string (for sensitive config)
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com`}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
                        Deployment (Vercel)
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-xl">
                            <h4 className="font-semibold mb-2">Build Command</h4>
                            <code className="bg-muted px-2 py-1 rounded text-xs">npm run build</code>
                        </div>
                        <div className="p-4 border rounded-xl">
                            <h4 className="font-semibold mb-2">Install Command</h4>
                            <code className="bg-muted px-2 py-1 rounded text-xs">npm install</code>
                        </div>
                    </div>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-base text-primary">Post-Deployment</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <p>1. Go to your deployed URL.</p>
                            <p>2. Sign in with the Google account matching <code>NEXT_PUBLIC_ADMIN_EMAIL</code>.</p>
                            <p>3. The first login will automatically provision your admin account based on the email.</p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    )
}

function OverviewContent() {
    return (
        <div className="space-y-8 text-foreground/90 leading-relaxed">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-xl font-light text-muted-foreground border-l-4 border-primary/50 pl-6 py-1">
                    Velocity VPN is a premium, free-to-use VPN application built with Flutter, designed for security, speed, and backend-driven flexibility.
                </p>

                <h3 className="text-2xl font-semibold mt-8 mb-4">Product Vision</h3>
                <p>
                    A secure internet access solution utilizing the <strong>OpenVPN</strong> protocol. It supports a hybrid infrastructure of
                    <strong> VPN Gate public servers</strong> (Free Tier) and <strong>Namecheap premium servers</strong> (Paid Tier).
                    The entire application is completely controlled via this Admin Panel, allowing for instant updates to configuration, monetization, and server lists without app store releases.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 not-prose">
                    <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-500">
                                <Smartphone className="w-5 h-5" /> Target Platforms
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Android (Primary)</strong>: Full feature set, background services.</li>
                                <li><strong>iOS (Secondary)</strong>: Strict compliance with Apple guidelines.</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-500">
                                <Layout className="w-5 h-5" /> technology Stack
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Frontend</strong>: Flutter 3.x+</li>
                                <li><strong>Protocol</strong>: OpenVPN (`openvpn_flutter`)</li>
                                <li><strong>Backend</strong>: Next.js + Firebase (Firestore/Auth)</li>
                                <li><strong>Ads</strong>: AdMob + Facebook Audience Network</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ArchitectureContent() {
    return (
        <div className="space-y-8">
            <p className="text-muted-foreground">
                The system follows a <strong>Backend-Driven UI</strong> approach. The mobile app is a "dumb" client that renders UI and behavior based on JSON configuration fetched at startup.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border rounded-xl p-6 bg-secondary/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-4"><Cloud className="w-4 h-4" /> Cloud Infrastructure</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between border-b pb-2">
                            <span>Admin Panel / API</span>
                            <Badge variant="outline">Vercel (Next.js)</Badge>
                        </li>
                        <li className="flex justify-between border-b pb-2">
                            <span>Database</span>
                            <Badge variant="outline">Firestore (NoSQL)</Badge>
                        </li>
                        <li className="flex justify-between border-b pb-2">
                            <span>Auth</span>
                            <Badge variant="outline">Firebase Auth</Badge>
                        </li>
                    </ul>
                </div>

                <div className="border rounded-xl p-6 bg-secondary/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-4"><Database className="w-4 h-4" /> Data Models</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex flex-col gap-1 border-b pb-2">
                            <span className="font-mono text-xs text-primary">users</span>
                            <span className="text-muted-foreground">Profiles & Plans</span>
                        </li>
                        <li className="flex flex-col gap-1 border-b pb-2">
                            <span className="font-mono text-xs text-primary">servers</span>
                            <span className="text-muted-foreground">VPN Nodes & Configs</span>
                        </li>
                        <li className="flex flex-col gap-1 border-b pb-2">
                            <span className="font-mono text-xs text-primary">config</span>
                            <span className="text-muted-foreground">Global Remote Config</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

function AuthFlowContent() {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Authentication Strategy</h3>
            <p className="text-muted-foreground">
                We utilize a hybrid auth system.
            </p>

            <div className="grid gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="text-base">App Launch (Anonymous)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>1. User opens app.</p>
                        <p>2. App fetches Config & Server List.</p>
                        <p>3. User can connect to "Free" tier servers immediately.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                        <CardTitle className="text-base">Login / Register</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>1. User enters verified credentials in App.</p>
                        <p>2. App calls `POST /api/auth/login` with Firebase ID Token.</p>
                        <p>3. Backend verifies ID token with Google.</p>
                        <p>4. Backend issues custom <strong>Access JWT</strong>.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ConfigSystemContent() {
    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                The App Config API operates as a remote feature flag system. The app requests this on every launch.
            </p>

            <EndpointDoc
                method="GET"
                path="/api/app/bootstrap"
                desc="Bootstrap endpoint. Fetches critical startup flags."
                response={{
                    "features": { "speedTest": true, "splitTunneling": false },
                    "min_version": "1.0.0",
                    "maintenance_mode": false
                }}
            />
        </div>
    )
}

function MonetizationContent() {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Ad Configuration</h3>
            <p className="text-muted-foreground">
                Ads are served via Google AdMob and Facebook Audience Network (FAN). We control placements and providers remotely.
            </p>
            <EndpointDoc
                method="GET"
                path="/api/app/config/ads"
                desc="Fetch Ad Units and Global Toggle"
                response={{
                    "enabled": true,
                    "provider": "admob",
                    "admob": {
                        "android": { "appId": "..." },
                        "ios": { "appId": "..." }
                    }
                }}
            />
        </div>
    )
}

function MobileApiContent() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 text-blue-500 w-fit rounded-lg px-3">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold text-sm">Consumed by Flutter App</span>
            </div>

            <EndpointDoc
                method="GET"
                path="/api/app/bootstrap"
                desc="Startup config, feature flags, version check."
                response={{ features: {}, min_version: "1.0.0" }}
            />
            <EndpointDoc
                method="GET"
                path="/api/app/config/ads"
                desc="Ad placements and provider keys."
                response={{ enabled: true, provider: "admob" }}
            />
            <EndpointDoc
                method="POST"
                path="/api/auth/login"
                desc="Exchange Firebase ID Token for Backend Access Token."
                requestBody={{ firebaseIdToken: "eyJhbG..." }}
                response={{ accessToken: "eyJ...", expiresIn: 3600 }}
            />
            <EndpointDoc
                method="POST"
                path="/api/vpn/session"
                desc="Create VPN Session & Get Credentials."
                requestBody={{ serverId: "s_123" }}
                response={{ ovpnConfig: "client...", username: "u_sess_1", password: "xyz" }}
            />
            <EndpointDoc
                method="POST"
                path="/api/vpn/revoke"
                desc="Revoke active VPN session."
                requestBody={{ sessionId: "sess_123" }}
                response={{ success: true }}
            />
            <EndpointDoc
                method="GET"
                path="/api/vpn/servers"
                desc="List all active servers."
                response={{ servers: [{ id: "1", name: "US East", tier: "free" }] }}
            />
            <EndpointDoc
                method="GET"
                path="/api/app/plans"
                desc="List available subscription plans."
                response={{ plans: [{ id: "premium_monthly", price: 9.99 }] }}
            />
            <EndpointDoc
                method="GET"
                path="/api/app/profile"
                desc="Get current user profile & subscription."
                response={{ uid: "...", plan: "free", status: "active" }}
            />
            <EndpointDoc
                method="GET"
                path="/api/app/more-apps"
                desc="Fetch list of cross-promotion apps."
                response={{ apps: [{ id: "com.example", name: "App Name", url: "https://..." }] }}
            />
        </div>
    )
}

function AdminApiContent() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 text-purple-500 w-fit rounded-lg px-3">
                <Terminal className="w-5 h-5" />
                <span className="font-semibold text-sm">Protected Admin Routes</span>
            </div>

            <p className="text-muted-foreground">Requires `Authorization: Bearer &lt;TOKEN&gt;` with `role: admin`.</p>

            <EndpointDoc
                method="GET"
                path="/api/admin/users"
                desc="List all users."
                response={{ users: [], total: 120 }}
            />
            <EndpointDoc
                method="PUT"
                path="/api/admin/users"
                desc="Update user status/plan."
                requestBody={{ uid: "...", status: "suspended" }}
                response={{ success: true }}
            />
            <EndpointDoc
                method="DELETE"
                path="/api/admin/users"
                desc="Delete a user."
                requestBody={{ uid: "..." }}
                response={{ success: true }}
            />
            <EndpointDoc
                method="GET"
                path="/api/admin/servers"
                desc="List all servers (including inactive)."
                response={{ servers: [] }}
            />
            <EndpointDoc
                method="POST"
                path="/api/admin/servers"
                desc="Provision new VPN node."
                requestBody={{ name: "DE Berlin", ip: "1.2.3.4", tier: "premium" }}
                response={{ success: true, id: "s_999" }}
            />
            <EndpointDoc
                method="GET"
                path="/api/admin/config"
                desc="Get global app configuration (raw)."
                response={{ features: {}, ads: {} }}
            />
            <EndpointDoc
                method="POST"
                path="/api/admin/config"
                desc="Update global app configuration."
                requestBody={{ features: { speedTest: false } }}
                response={{ success: true }}
            />
            <EndpointDoc
                method="GET"
                path="/api/admin/logs"
                desc="Get admin activity logs."
                response={{ logs: [] }}
            />
            <EndpointDoc
                method="GET"
                path="/api/admin/notifications"
                desc="List push notifications."
                response={{ notifications: [] }}
            />
        </div>
    )
}

// --- UTILITY COMPONENTS ---

function EndpointDoc({
    method,
    path,
    desc,
    requestBody,
    response
}: {
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    desc: string,
    requestBody?: any,
    response: any
}) {
    const [copied, setCopied] = useState(false)

    const copyCurl = () => {
        const curl = `curl -X ${method} "https://api.velocityvpn.com${path}" \\
${method !== "GET" ? "  -H \"Content-Type: application/json\" \\" : ""}
  -H "Authorization: Bearer <TOKEN>"${requestBody ? ` \\
  -d '${JSON.stringify(requestBody)}'` : ""}`

        navigator.clipboard.writeText(curl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const methodColors = {
        GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        POST: "bg-green-500/10 text-green-500 border-green-500/20",
        PUT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
        <Card className="overflow-hidden border bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border-b bg-muted/20">
                <div className={cn("px-3 py-1 rounded-md text-xs font-mono font-bold border", methodColors[method])}>
                    {method}
                </div>
                <code className="text-sm font-mono flex-1 text-foreground/80">{path}</code>
                <p className="text-sm text-muted-foreground md:text-right">{desc}</p>
            </div>

            <div className="p-0">
                <Tabs defaultValue="curl" className="w-full">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10">
                        <TabsList className="h-7 bg-transparent p-0 gap-4">
                            <TabsTrigger value="curl" className="h-7 px-0 bg-transparent text-xs text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Request</TabsTrigger>
                            <TabsTrigger value="response" className="h-7 px-0 bg-transparent text-xs text-muted-foreground data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Response</TabsTrigger>
                        </TabsList>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background/20" onClick={copyCurl}>
                            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                    </div>

                    <TabsContent value="curl" className="m-0 group relative">
                        <pre className="p-5 overflow-x-auto text-xs font-mono bg-[#0d1117] text-gray-300 leading-relaxed scrollbar-hide">
                            {`curl -X ${method} "https://api.velocityvpn.com${path}" \\
  -H "Authorization: Bearer <TOKEN>"${method !== "GET" ? " \\" : ""}
${method !== "GET" ? `  -H "Content-Type: application/json"${requestBody ? " \\" : ""}` : ""}${requestBody ? `
  -d '${JSON.stringify(requestBody, null, 2)}'` : ""}`}
                        </pre>
                    </TabsContent>

                    <TabsContent value="response" className="m-0">
                        <div className="bg-[#0d1117] p-5">
                            <pre className="overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed scrollbar-hide">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Card>
    )
}
