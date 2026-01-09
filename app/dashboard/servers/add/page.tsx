"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, FileText, Loader2, Globe, Server, Shield, Wifi, Lock, UploadCloud } from "lucide-react"
import Link from "next/link"
import { CountrySelector } from "@/components/country-selector"
import { parseOVPNFile } from "@/lib/ovpn-parser"
import { addServer, getCountryFlag, updateServer, deleteServer } from "@/lib/server-service"
import { toast } from "sonner"

export default function AddServerPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)

  const [ovpnFile, setOvpnFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    ip: "",
    port: "1194",
    protocol: "UDP",
    tier: "free",
    maxCapacity: "500",
    streaming: false,
    p2p: false,
    notes: "",
    isActive: true,
    username: "spshostpika@namecheap",
    password: "f0ZCRr2pFe",
  })

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.push("/dashboard/servers")
      toast.error("Access Denied", {
        description: "You do not have permission to add servers.",
      })
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleOVPNUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".ovpn")) {
      toast.error("Invalid file type", {
        description: "Please upload a .ovpn file",
      })
      return
    }

    setOvpnFile(file)

    // Read and parse the file
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = parseOVPNFile(content)

      if (result.isValid && result.config) {
        setFormData((prev) => ({
          ...prev,
          ip: result.config!.ip,
          port: result.config!.port,
          protocol: result.config!.protocol,
        }))
        toast.success("File parsed successfully", {
          description: "Server details extracted from OVPN file",
        })
      } else {
        const errorMsg = result.errors.join(", ")
        toast.error("Invalid OVPN File", {
          description: errorMsg || "Could not extract server details from OVPN file",
        })
        // Optionally clear the invalid file
        setOvpnFile(null)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let ovpnFileContent = ""
      let ovpnFileName = ""

      if (ovpnFile) {
        const { fileToBase64 } = await import("@/lib/server-service")
        ovpnFileContent = await fileToBase64(ovpnFile)
        ovpnFileName = ovpnFile.name
      }

      // 1. Create Server and upload OVPN in one go (Secure Backend Phase 1)
      await addServer({
        name: formData.name,
        country: formData.country,
        flag: getCountryFlag(formData.country),
        ip: formData.ip,
        port: Number(formData.port),
        protocol: formData.protocol,
        tier: formData.tier as "free" | "premium",
        maxCapacity: Number(formData.maxCapacity),
        streaming: formData.streaming,
        p2p: formData.p2p,
        notes: formData.notes,
        status: "online",
        load: 0,
        currentUsers: 0,
        isActive: formData.isActive,
        username: formData.username,
        password: formData.password,
        ovpnFileContent,
        ovpnFileName,
      })

      toast.success("Server added successfully", {
        description: `${formData.name} has been added to your server list`,
      })

      router.push("/dashboard/servers")
    } catch (error: any) {
      console.error("Error adding server:", error)
      toast.error("Error adding server", {
        description: error.message || "Please check your configuration and try again",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/servers">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Server</h1>
            <p className="text-muted-foreground mt-1">Configure a new VPN endpoint for your network</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/servers")} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Server
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Info & Connection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>Primary identification details for this server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Server Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. US-NewYork-01"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Location</Label>
                  <CountrySelector
                    value={formData.country}
                    onChange={(value) => setFormData({ ...formData, country: value })}
                    placeholder="Select server location..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Rack location, provider details, or maintenance notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                Connection Configuration
              </CardTitle>
              <CardDescription>Upload an OVPN file to auto-fill these details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-center cursor-pointer relative group">
                <Input
                  type="file"
                  accept=".ovpn"
                  onChange={handleOVPNUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {ovpnFile ? (
                    <>
                      <FileText className="h-10 w-10 text-emerald-500" />
                      <div className="font-medium text-emerald-600">{ovpnFile.name}</div>
                      <div className="text-sm text-muted-foreground">Config loaded successfully</div>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="font-medium">Drop OVPN file here or click to browse</div>
                      <div className="text-xs text-muted-foreground">Automatically extracts IP, Port and Protocol</div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    placeholder="0.0.0.0"
                    value={formData.ip}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="1194"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <Select value={formData.protocol} onValueChange={(val) => setFormData({ ...formData, protocol: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UDP">UDP (Faster)</SelectItem>
                      <SelectItem value="TCP">TCP (Reliable)</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings & Credentials */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Server Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Status</Label>
                  <p className="text-xs text-muted-foreground">Visible to users</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                />
              </div>

              <div className="space-y-2">
                <Label>Server Tier</Label>
                <Select value={formData.tier} onValueChange={(val) => setFormData({ ...formData, tier: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Server</SelectItem>
                    <SelectItem value="premium">Premium Server 👑</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors">
                <Checkbox
                  id="streaming"
                  checked={formData.streaming}
                  onCheckedChange={(c) => setFormData({ ...formData, streaming: c as boolean })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="streaming" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Streaming Optimized
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Unlocks Netflix, Hulu, etc.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors">
                <Checkbox
                  id="p2p"
                  checked={formData.p2p}
                  onCheckedChange={(c) => setFormData({ ...formData, p2p: c as boolean })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="p2p" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    P2P / Torrenting
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allows file sharing protocols
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
