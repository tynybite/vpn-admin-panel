"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Bell, Palette, Clock, Database, Download, Trash2, Check, PanelRight } from "lucide-react"
import { usePreferences } from "@/components/preferences-provider"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/api-client"
import { toast } from "sonner"
import { AdminAlert } from "@/components/admin-alert"

export default function PreferencesPage() {
  const { colorScheme, setColorScheme, sidebarDensity, setSidebarDensity } = usePreferences()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Local state for non-global preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [serverAlerts, setServerAlerts] = useState(true)
  const [userAlerts, setUserAlerts] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState([30])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load ALL preferences (including local ones) from API on mount
  useEffect(() => {
    if (!user) return

    const loadSettings = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/preferences")
        if (res.ok) {
          const data = await res.json()
          const p = data.preferences
          if (p) {
            if (p.emailNotifications !== undefined) setEmailNotifications(p.emailNotifications)
            if (p.pushNotifications !== undefined) setPushNotifications(p.pushNotifications)
            if (p.serverAlerts !== undefined) setServerAlerts(p.serverAlerts)
            if (p.userAlerts !== undefined) setUserAlerts(p.userAlerts)
            if (p.autoRefresh !== undefined) setAutoRefresh(p.autoRefresh)
            if (p.refreshInterval !== undefined) setRefreshInterval(p.refreshInterval)
            // Provider handles colorScheme/density separately via its own sync
          }
        }
      } catch (e) {
        console.error("Failed to load settings", e)
      }
    }
    loadSettings()
  }, [user])

  // Helper to save any preference change
  const saveSetting = async (key: string, value: any) => {
    try {
        // Optimistic update handled by local setters
        // Save to cloud
        await fetchWithAuth("/api/admin/preferences", {
            method: "POST",
            body: JSON.stringify({ preferences: { [key]: value } })
        })
    } catch (e) {
        toast.error("Error saving setting", {
            description: "Could not save your changes to the cloud.",
        })
    }
  }

  // Wrappers to update state AND save
  const handleEmailChange = (checked: boolean) => { setEmailNotifications(checked); saveSetting("emailNotifications", checked); }
  const handlePushChange = (checked: boolean) => { setPushNotifications(checked); saveSetting("pushNotifications", checked); }
  const handleServerAlertsChange = (checked: boolean) => { setServerAlerts(checked); saveSetting("serverAlerts", checked); }
  const handleUserAlertsChange = (checked: boolean) => { setUserAlerts(checked); saveSetting("userAlerts", checked); }
  const handleAutoRefreshChange = (checked: boolean) => { setAutoRefresh(checked); saveSetting("autoRefresh", checked); }
  const handleRefreshIntervalChange = (val: number[]) => { setRefreshInterval(val); saveSetting("refreshInterval", val); }

  const colorSchemes = [
    { id: "blue" as const, name: "International Blue", class: "bg-blue-600" },
    { id: "purple" as const, name: "Deep Purple", class: "bg-purple-600" },
    { id: "green" as const, name: "Swiss Green", class: "bg-emerald-600" },
    { id: "orange" as const, name: "Safety Orange", class: "bg-orange-600" },
    { id: "pink" as const, name: "Neon Pink", class: "bg-pink-600" },
  ] as const

  if (!mounted) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <div className="border-b border-border pb-6 flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-heading font-bold uppercase tracking-tight">System Preferences</h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">Customize interface behavior and alerts.</p>
        </div>
        <div className="hidden md:block">
             <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground uppercase font-bold text-xs" onClick={() => toast.success("Preferences Synced")}>
                Sync Settings
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Appearance */}
          <Card className="rounded-none border-border shadow-none h-fit">
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                <Palette className="h-5 w-5" />
                Visual Interface
              </CardTitle>
              <CardDescription className="uppercase text-xs tracking-wider">Theme, color, and density</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="space-y-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">App Theme</Label>
                <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                  {[
                      { id: "light", bg: "bg-white", border: "border-gray-200" },
                      { id: "dark", bg: "bg-zinc-950", border: "border-zinc-800" },
                      { id: "system", bg: "bg-gradient-to-r from-gray-200 to-zinc-800", border: "border-gray-400" }
                  ].map((t) => (
                    <Label
                        key={t.id}
                        htmlFor={t.id}
                        className={cn(
                            "flex flex-col gap-2 cursor-pointer group opacity-70 data-[state=checked]:opacity-100",
                            theme === t.id && "opacity-100"
                        )}
                        data-state={theme === t.id ? "checked" : "unchecked"}
                    >
                        <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                        <div className={cn(
                            "h-20 w-full border-2 transition-all p-1",
                            theme === t.id ? "border-primary ring-1 ring-primary/20" : "border-border group-hover:border-primary/50"
                        )}>
                            <div className={cn("w-full h-full", t.bg)} />
                        </div>
                        <span className="text-center text-xs font-bold uppercase tracking-wider">{t.id}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Accent Color</Label>
                <div className="grid grid-cols-5 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setColorScheme(scheme.id)}
                      className={cn(
                        "relative h-12 w-full border-2 transition-all hover:scale-105 rounded-none",
                        colorScheme === scheme.id ? "border-foreground" : "border-transparent",
                      )}
                      title={scheme.name}
                    >
                      <div className={cn("h-full w-full", scheme.class)} />
                      {colorScheme === scheme.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Sidebar Density</Label>
                <Select value={sidebarDensity} onValueChange={(value) => setSidebarDensity(value as any)}>
                  <SelectTrigger className="rounded-none border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    <SelectItem value="compact">COMPACT</SelectItem>
                    <SelectItem value="comfortable">COMFORTABLE</SelectItem>
                    <SelectItem value="spacious">SPACIOUS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Right Column Group */}
          <div className="space-y-8">
                {/* Notification Preferences */}
                <Card className="rounded-none border-border shadow-none">
                    <CardHeader className="border-b border-border bg-muted/20">
                    <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                        <Bell className="h-5 w-5" />
                        Alerts & Notifications
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-border">
                        {[
                            { label: "Email Notifications", desc: "Receive automated reports via email", state: emailNotifications, fn: handleEmailChange },
                            { label: "Push Notifications", desc: "Browser alerts for critical events", state: pushNotifications, fn: handlePushChange },
                            { label: "Server Alerts", desc: "Notify when server load > 90%", state: serverAlerts, fn: handleServerAlertsChange },
                            { label: "User Registration", desc: "Notify on new user signups", state: userAlerts, fn: handleUserAlertsChange },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-4 first:pt-6 last:pb-2">
                                <div className="space-y-1">
                                    <Label className="text-sm uppercase font-bold">{item.label}</Label>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <Switch checked={item.state} onCheckedChange={item.fn} className="data-[state=checked]:bg-primary"/>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Dashboard Settings */}
                <Card className="rounded-none border-border shadow-none">
                    <CardHeader className="border-b border-border bg-muted/20">
                    <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                        <Clock className="h-5 w-5" />
                        Live Data
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                            <Label className="text-sm uppercase font-bold">Auto Refresh</Label>
                            <p className="text-xs text-muted-foreground">Poll for new data automatically</p>
                            </div>
                            <Switch checked={autoRefresh} onCheckedChange={handleAutoRefreshChange} className="data-[state=checked]:bg-primary"/>
                        </div>

                        {autoRefresh && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Refresh Interval</Label>
                                    <span className="text-xs font-mono font-bold">{refreshInterval[0]}s</span>
                                </div>
                                <Slider
                                    value={refreshInterval}
                                    onValueChange={handleRefreshIntervalChange}
                                    min={10}
                                    max={120}
                                    step={10}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Management */}
                <Card className="rounded-none border-border shadow-none">
                    <CardHeader className="border-b border-border bg-muted/20">
                    <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                        <Database className="h-5 w-5" />
                        Data
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                    <Button variant="outline" className="w-full justify-start rounded-none border-border uppercase text-xs font-bold h-10">
                        <Download className="mr-2 h-4 w-4" />
                        Export All Logs (CSV)
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none uppercase text-xs font-bold h-10"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Local Cache
                    </Button>
                    </CardContent>
                </Card>
          </div>
      </div>
    </div>
  )
}
