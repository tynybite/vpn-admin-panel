"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Palette, Upload } from "lucide-react"
import { useConfig } from "@/hooks/use-config"
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"

export default function UiConfigPage() {
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">UI & Branding</h1>
                    <p className="text-muted-foreground font-sans text-sm mt-1">Customize mobile app appearance and identity.</p>
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

            <Card className="rounded-none border shadow-none bg-card">
                <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2 font-heading uppercase text-lg">
                        <Palette className="h-5 w-5 text-primary" />
                        Theme Customization
                    </CardTitle>
                    <CardDescription className="uppercase text-xs tracking-wider">Colors, logos, and messaging</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="primaryColor" className="text-xs uppercase font-bold text-muted-foreground">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="primaryColor"
                                    type="color"
                                    value={config.ui.primaryColor}
                                    onChange={(e) => updateConfig("ui", "primaryColor", e.target.value)}
                                    className="w-12 h-10 p-1 cursor-pointer rounded-none border-border"
                                />
                                <Input
                                    value={config.ui.primaryColor}
                                    className="flex-1 rounded-none font-mono"
                                    onChange={(e) => updateConfig("ui", "primaryColor", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accentColor" className="text-xs uppercase font-bold text-muted-foreground">Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="accentColor"
                                    type="color"
                                    value={config.ui.accentColor}
                                    onChange={(e) => updateConfig("ui", "accentColor", e.target.value)}
                                    className="w-12 h-10 p-1 cursor-pointer rounded-none border-border"
                                />
                                <Input
                                    value={config.ui.accentColor}
                                    className="flex-1 rounded-none font-mono"
                                    onChange={(e) => updateConfig("ui", "accentColor", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appName" className="text-xs uppercase font-bold text-muted-foreground">App Name</Label>
                            <Input
                                id="appName"
                                value={config.ui.appName}
                                onChange={(e) => updateConfig("ui", "appName", e.target.value)}
                                className="rounded-none border-border font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl" className="text-xs uppercase font-bold text-muted-foreground">Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="logoUrl"
                                    value={config.ui.logoUrl}
                                    onChange={(e) => updateConfig("ui", "logoUrl", e.target.value)}
                                    className="flex-1 rounded-none border-border font-mono text-sm"
                                />
                                <Button variant="outline" size="icon" className="rounded-none hover:bg-muted/80">
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <Separator className="bg-border" />
                    <div className="space-y-2">
                        <Label htmlFor="showcaseText" className="text-xs uppercase font-bold text-muted-foreground">Feature Showcase Text</Label>
                        <Textarea
                            id="showcaseText"
                            value={config.ui.showcaseText}
                            onChange={(e) => updateConfig("ui", "showcaseText", e.target.value)}
                            rows={4}
                            className="rounded-none border-border bg-muted/20"
                        />
                    </div>
                </CardContent>
            </Card>
        </div >

    )
}
