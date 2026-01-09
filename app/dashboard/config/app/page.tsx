"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Save, Loader2, Smartphone, Zap } from "lucide-react"
import { useConfig } from "@/hooks/use-config"
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"

export default function AppConfigPage() {
    const { config, loading, hasChanges, updateConfig, saveConfig, saving } = useConfig()
    const { user } = useAuth()
    const isAdmin = user?.role === "admin"

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">App Configuration</h1>
                    <p className="text-muted-foreground font-sans text-sm">Manage app versioning, caching, and maintenance strategies.</p>
                </div>
                <Button
                    onClick={saveConfig}
                    disabled={!hasChanges || saving || !isAdmin}
                    className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    PUBLISH CHANGES
                    {hasChanges && (
                        <Badge variant="secondary" className="ml-2 rounded-none">
                            DRAFT
                        </Badge>
                    )}
                </Button>
            </div>

            <AdminAlert />

            <div className="grid gap-6">
                <Card className="rounded-none border shadow-none bg-card">
                    <CardHeader className="border-b border-border">
                        <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Version Control
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider">Control minimum app versions and forced updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="minVersion" className="text-xs uppercase font-bold text-muted-foreground">Minimum App Version</Label>
                                <Input
                                    id="minVersion"
                                    placeholder="e.g. 1.0.0"
                                    value={config.version.minVersion}
                                    onChange={(e) => updateConfig("version", "minVersion", e.target.value)}
                                    className="rounded-none font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground uppercase">
                                    Users with older versions will update.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cacheVersion" className="text-xs uppercase font-bold text-muted-foreground">Cache Version</Label>
                                <Input
                                    id="cacheVersion"
                                    type="number"
                                    value={isNaN(config.version.cacheVersion) ? "" : config.version.cacheVersion}
                                    onChange={(e) => updateConfig("version", "cacheVersion", e.target.value === "" ? 0 : parseInt(e.target.value))}
                                    className="rounded-none font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground uppercase">
                                    Increment to clear user cache.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between space-x-2 border border-border p-4 bg-muted/10">
                            <div className="space-y-0.5">
                                <Label className="text-xs uppercase font-bold">Maintenance Mode</Label>
                                <p className="text-[10px] text-muted-foreground uppercase">
                                    Block access for all users.
                                </p>
                            </div>
                            <Switch
                                checked={config.version.maintenanceMode}
                                onCheckedChange={(checked) => updateConfig("version", "maintenanceMode", checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none border shadow-none bg-card">
                    <CardHeader className="border-b border-border">
                        <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                            <Zap className="h-5 w-5 text-primary" />
                            Feature Flags
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider">Toggle specific app capabilities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {[
                            { id: "killswitch", name: "Kill Switch", desc: "Block internet if VPN drops" },
                            { id: "splitTunnel", name: "Split Tunneling", desc: "Allow app exclusions" },
                            { id: "autoReconnect", name: "Auto Reconnect", desc: "Reconnect on network change" },
                            { id: "subscriptions", name: "Subscriptions", desc: "Enable in-app purchases" },
                            { id: "experimental", name: "Experimental", desc: "Enable beta features" },
                        ].map((feature) => (
                            <div key={feature.id} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Label htmlFor={feature.id} className="text-sm font-bold uppercase">
                                            {feature.name}
                                        </Label>
                                        {config.features[feature.id as keyof typeof config.features] ? (
                                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600 rounded-none h-5 px-1 bg-emerald-500/10">ACTIVE</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground rounded-none h-5 px-1">DISABLED</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                </div>
                                <Switch
                                    id={feature.id}
                                    checked={config.features[feature.id as keyof typeof config.features]}
                                    onCheckedChange={(val) => updateConfig("features", feature.id, val)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
