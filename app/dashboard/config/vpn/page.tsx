"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Save, Loader2, Shield } from "lucide-react"
import { useConfig } from "@/hooks/use-config"
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"

export default function VpnConfigPage() {
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
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">VPN Configuration</h1>
                    <p className="text-muted-foreground font-sans text-sm mt-1">Technical network parameters and protocols.</p>
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
                        <Shield className="h-5 w-5 text-primary" />
                        Connection Settings
                    </CardTitle>
                    <CardDescription className="uppercase text-xs tracking-wider">Configure timeouts and protocols</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="connectionTimeout" className="text-xs uppercase font-bold text-muted-foreground">Connection Timeout (sec)</Label>
                            <Input
                                id="connectionTimeout"
                                type="number"
                                value={config.vpn.connectionTimeout}
                                onChange={(e) => updateConfig("vpn", "connectionTimeout", parseInt(e.target.value))}
                                className="rounded-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reconnectAttempts" className="text-xs uppercase font-bold text-muted-foreground">Reconnect Attempts</Label>
                            <Input
                                id="reconnectAttempts"
                                type="number"
                                value={config.vpn.reconnectAttempts}
                                onChange={(e) => updateConfig("vpn", "reconnectAttempts", parseInt(e.target.value))}
                                className="rounded-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reconnectDelay" className="text-xs uppercase font-bold text-muted-foreground">Reconnect Delay (sec)</Label>
                            <Input
                                id="reconnectDelay"
                                type="number"
                                value={config.vpn.reconnectDelay}
                                onChange={(e) => updateConfig("vpn", "reconnectDelay", parseInt(e.target.value))}
                                className="rounded-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="protocol" className="text-xs uppercase font-bold text-muted-foreground">Preferred Protocol</Label>
                            <Select
                                value={config.vpn.protocol}
                                onValueChange={(val) => updateConfig("vpn", "protocol", val)}
                            >
                                <SelectTrigger id="protocol" className="rounded-none border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-border">
                                    <SelectItem value="auto">AUTO (Recommended)</SelectItem>
                                    <SelectItem value="udp">UDP (Faster)</SelectItem>
                                    <SelectItem value="tcp">TCP (Reliable)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Separator className="bg-border" />
                    <div className="space-y-2">
                        <Label htmlFor="customDns" className="text-xs uppercase font-bold text-muted-foreground">Custom DNS Servers</Label>
                        <Textarea
                            id="customDns"
                            value={config.vpn.customDns}
                            onChange={(e) => updateConfig("vpn", "customDns", e.target.value)}
                            rows={3}
                            placeholder="8.8.8.8, 8.8.4.4"
                            className="rounded-none border-border font-mono text-sm bg-muted/20"
                        />
                        <p className="text-[10px] text-muted-foreground uppercase">Comma-separated IPs</p>
                    </div>
                </CardContent>
            </Card>
        </div >

    )
}
