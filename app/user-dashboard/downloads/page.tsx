"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Monitor, Smartphone, Apple } from "lucide-react"

export default function DownloadsPage() {
    const platforms = [
        {
            name: "Android",
            icon: Smartphone,
            version: "2.4.1",
            size: "45 MB",
            desc: "Requires Android 8.0+",
            primary: true
        },
        {
            name: "iOS",
            icon: Apple,
            version: "2.3.0",
            size: "62 MB",
            desc: "Requires iOS 14.0+",
            primary: false
        },
        {
            name: "Windows",
            icon: Monitor,
            version: "1.2.5",
            size: "85 MB",
            desc: "Windows 10/11 (64-bit)",
            primary: false
        },
        {
            name: "macOS",
            icon: Monitor,
            version: "1.1.0",
            size: "92 MB",
            desc: "macOS 12.0+ (Apple Silicon/Intel)",
            primary: false
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Downloads</h1>
                <p className="text-muted-foreground">Download Velocity VPN for all your devices</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {platforms.map((platform, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg">
                                    <platform.icon className="h-6 w-6" />
                                </div>
                                {platform.name}
                            </CardTitle>
                            <CardDescription>{platform.desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Version</span>
                                    <span className="font-medium">{platform.version}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Size</span>
                                    <span className="font-medium">{platform.size}</span>
                                </div>
                            </div>
                            <Button className="w-full mt-4" variant={platform.primary ? "default" : "outline"}>
                                <Download className="mr-2 h-4 w-4" />
                                Download for {platform.name}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
