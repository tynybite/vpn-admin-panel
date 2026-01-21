"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Server,
  Users,
  Settings,
  BarChart3,
  Activity,
  Menu,
  Search,
  ChevronRight,
  Shield,
  LogOut,
  User,
  Moon,
  Sun,
  Smartphone,
  Zap,
  Palette,
  DollarSign,
  Send,
  FileText,
  PlusCircle,
  Computer,
  Book,
  Globe,
  Cloud,
  Lock,
  Terminal,
  Mail,
  Rocket,
  ChevronDown
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  const { user, signOut, loading } = useAuth()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Sign out failed")
    }
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Servers",
      href: "/dashboard/servers",
      icon: Server,
      children: [
        { name: "All Servers", href: "/dashboard/servers", icon: Computer },
        { name: "Add New Server", href: "/dashboard/servers/add", icon: PlusCircle },
      ]
    },
    { name: "Users", href: "/dashboard/users", icon: Users },
    {
      name: "Configuration",
      href: "/dashboard/config",
      icon: Settings,
      children: [
        { name: "App Config", href: "/dashboard/config/app", icon: Zap },
        { name: "Advertising", href: "/dashboard/config/ads", icon: DollarSign },
        { name: "UI & Branding", href: "/dashboard/config/ui", icon: Palette },
        { name: "VPN Settings", href: "/dashboard/config/vpn", icon: Shield },
        { name: "Subscriptions", href: "/dashboard/config/subscriptions", icon: Settings },
        { name: "SMTP Settings", href: "/dashboard/smtp", icon: Mail },
      ]
    },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
    { name: "Notifications", href: "/dashboard/notifications", icon: Send },
    { name: "Activity Logs", href: "/dashboard/logs", icon: FileText },
    {
      name: "Docs",
      href: "/dashboard/docs",
      icon: Book,
      children: [
        { name: "System Overview", href: "/dashboard/docs?section=overview", icon: Globe },
        { name: "Mobile API", href: "/dashboard/docs?section=mobile-api", icon: Smartphone },
        { name: "Admin API", href: "/dashboard/docs?section=admin-api", icon: Terminal },
      ]
    },
    { name: "More Apps", href: "/dashboard/more-apps", icon: Smartphone },
  ]

  useEffect(() => {
    navigation.forEach(item => {
      // @ts-ignore
      if (item.children && item.children.some(child => pathname === child.href)) {
        setExpandedMenus(prev => {
          if (!prev.includes(item.name)) return [...prev, item.name]
          return prev
        })
      }
    })
  }, [pathname])

  if (!mounted || loading) {
    return <div className="min-h-screen bg-background" />
  }

  const NavLink = ({ item, isCollapsed }: { item: (typeof navigation)[0], isCollapsed: boolean }) => {
    // @ts-ignore
    const isActive = pathname === item.href || (item.children && item.children.some(c => pathname === c.href))
    const isExpanded = expandedMenus.includes(item.name)
    // @ts-ignore
    const hasChildren = item.children && item.children.length > 0

    const toggleMenu = (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault()
        setExpandedMenus(prev =>
          prev.includes(item.name)
            ? prev.filter(n => n !== item.name)
            : [...prev, item.name]
        )
      }
    }

    if (isCollapsed) {
       return (
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-l-2",
                isActive
                  ? "border-primary bg-accent/50 text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
            </div>
           </DropdownMenuTrigger>
           {hasChildren && (
             <DropdownMenuContent side="right" className="rounded-none border-border">
               <DropdownMenuLabel className="font-heading uppercase tracking-widest text-xs">{item.name}</DropdownMenuLabel>
               <DropdownMenuSeparator />
               {/* @ts-ignore */}
               {item.children?.map(child => (
                 <DropdownMenuItem key={child.href} asChild className="rounded-none">
                   <Link href={child.href} className="flex items-center gap-2 cursor-pointer">
                     {child.icon && <child.icon className="w-4 h-4" />}
                     {child.name}
                   </Link>
                 </DropdownMenuItem>
               ))}
             </DropdownMenuContent>
           )}
        </DropdownMenu>
       )
    }

    return (
      <div className="w-full">
        <Link
          href={hasChildren ? "#" : item.href}
          onClick={(e) => {
            if (hasChildren) toggleMenu(e)
            else setMobileOpen(false)
          }}
          className={cn(
            "flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-l-2 hover:bg-muted/50",
            isActive
              ? "border-primary text-foreground bg-accent/20"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
            <span className="uppercase tracking-wide text-xs font-semibold">{item.name}</span>
          </div>
          {hasChildren && (
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "")} />
          )}
        </Link>

        {hasChildren && isExpanded && (
          <div className="bg-muted/20 border-b border-border">
            {/* @ts-ignore */}
            {item.children?.map(child => {
              const isChildActive = pathname === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 py-2 pl-12 pr-6 text-sm transition-colors block border-l-2",
                    isChildActive
                      ? "border-primary text-foreground font-medium bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {child.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand Header */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
         isCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-heading font-bold text-lg">
            P
          </div>
          {!isCollapsed && (
             <span className="text-lg font-heading font-bold tracking-tight uppercase">
               Pika<span className="text-muted-foreground">VPN</span>
             </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className={cn(
                  "flex items-center w-full gap-3 hover:bg-muted/50 p-2 transition-colors border border-transparent hover:border-border",
                  isCollapsed ? "justify-center" : ""
               )}>
                  <Avatar className="h-8 w-8 rounded-none border border-border">
                     <AvatarImage src={user?.photoURL || ""} />
                     <AvatarFallback className="rounded-none bg-accent text-accent-foreground font-heading">
                        {user?.displayName?.substring(0, 1).toUpperCase() || "A"}
                     </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                     <div className="text-left overflow-hidden">
                        <div className="text-xs font-bold uppercase truncate">{user?.displayName || "Admin"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">Administrator</div>
                     </div>
                  )}
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-border">
                <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                  <Link href="/dashboard/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                  <Link href="/dashboard/preferences" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Preferences</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive rounded-none cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300 relative z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent isCollapsed={collapsed} />
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-30 h-6 w-6 flex items-center justify-center bg-background border border-border text-foreground hover:bg-accent transition-colors"
        >
           <ChevronRight className={cn("h-3 w-3 transition-transform", !collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border rounded-none">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex items-center px-6 justify-between gap-4">
           {/* Left: Mobile Toggle & Breadcrumbs */}
           <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden">
                 <Menu className="h-5 w-5" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-medium">
                 <span className="text-foreground">App</span>
                 <span className="text-muted-foreground/40">/</span>
                 <span>{pathname.split('/').pop() || 'Overview'}</span>
              </div>
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                  placeholder="SEARCH..." 
                  className="pl-9 h-9 rounded-none bg-muted/30 border-border focus:border-primary w-64 text-xs font-medium uppercase placeholder:text-muted-foreground/70" 
                 />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-none border-border h-9 w-9"
              >
                 {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
           </div>
        </header>

        <main className="flex-1 overflow-auto p-0">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8">
             {children}
          </div>
        </main>
      </div>
    </div>
  )
}
