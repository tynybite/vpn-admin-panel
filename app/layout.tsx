import type React from "react"
import type { Metadata } from "next"
import { Oswald, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { PreferencesProvider } from "@/components/preferences-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Super VPN - Admin Panel",
  description: "Secure VPN management dashboard with advanced analytics and control",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased h-full overflow-auto bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="cloudvpn-theme" enableSystem>
          <AuthProvider>
            <PreferencesProvider>{children}</PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
