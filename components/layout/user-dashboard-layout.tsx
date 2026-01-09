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
    Menu,
    Search,
    Bell,
    ChevronLeft,
    ChevronRight,
    Shield,
    LogOut,
    User,
    Moon,
    Sun,
    ChevronDown,
    Globe,
    Lock,
    Download,
    HelpCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { usePreferences } from "@/components/preferences-provider"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

interface UserDashboardLayoutProps {
    children: React.ReactNode
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Find valid parent menus to expand based on current path
    const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
        return []
    })
    const { theme, setTheme } = useTheme()
    const { sidebarDensity } = usePreferences()
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const { user, signOut } = useAuth()

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            toast.success("Signed out successfully", {
                description: "You have been logged out of your account.",
            })
            router.push("/login")
        } catch (error) {
            toast.error("Sign out failed", {
                description: "There was an error signing you out. Please try again.",
            })
        }
    }

    const densityClasses = {
        compact: { py: "py-1.5", gap: "gap-2", textSize: "text-xs", iconSize: "h-4 w-4" },
        comfortable: { py: "py-2.5", gap: "gap-3", textSize: "text-sm", iconSize: "h-5 w-5" },
        spacious: { py: "py-3.5", gap: "gap-4", textSize: "text-base", iconSize: "h-6 w-6" },
    }
    const density = densityClasses[sidebarDensity || 'comfortable']

    const navigation = [
        { name: "Dashboard", href: "/user-dashboard", icon: LayoutDashboard },
        { name: "My Subscription", href: "/user-dashboard/subscription", icon: Shield },
        { name: "Downloads", href: "/user-dashboard/downloads", icon: Download },
        { name: "Profile", href: "/user-dashboard/profile", icon: User },
        { name: "Help & Support", href: "/user-dashboard/support", icon: HelpCircle },
    ]

    // Effect to auto-expand menu if a child is active
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

    // Added isCollapsed prop to decouple from parent state
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

        if (isCollapsed && hasChildren) {
            return (
                <Link
                    href={item.href}
                    className={cn(
                        "flex items-center justify-center rounded-xl p-2 transition-all duration-200 group relative",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setMobileOpen(false)}
                >
                    <item.icon className={cn("flex-shrink-0 w-5 h-5")} />
                </Link>
            )
        }

        return (
            <div className="space-y-1">
                <Link
                    href={hasChildren ? "#" : item.href}
                    onClick={(e) => {
                        if (hasChildren) toggleMenu(e)
                        else setMobileOpen(false)
                    }}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group select-none",
                        isCollapsed ? "justify-center" : "justify-between",
                        isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        <item.icon className={cn("flex-shrink-0 w-4 h-4", isActive ? "text-primary" : "text-muted-foreground", "group-hover:text-foreground transition-colors")} />
                        {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && hasChildren && (
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", isExpanded ? "rotate-180" : "")} />
                    )}
                </Link>


                {hasChildren && isExpanded && !isCollapsed && (
                    <div className="ml-9 space-y-0.5 border-l px-2 border-border/50">
                        {/* @ts-ignore */}
                        {item.children?.map(child => {
                            // Exact active check using search params if present
                            const isChildActive = child.href.includes('?')
                                ? (pathname === child.href.split('?')[0] && searchParams.toString() === child.href.split('?')[1])
                                : pathname === child.href

                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg py-2 pl-3 pr-2 text-sm transition-colors relative",
                                        isChildActive
                                            ? "text-primary font-medium bg-primary/5"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    {/* Active Dot */}
                                    {isChildActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                                    )}

                                    {child.icon && <child.icon className="w-4 h-4 opacity-70" />}
                                    {child.name}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    // Refactored SidebarContent to accept isCollapsed override
    const SidebarContent = ({ isCollapsed = false, hideHeader = false }: { isCollapsed?: boolean, hideHeader?: boolean }) => (
        <>
            {!hideHeader && (
                <div className={cn("flex h-16 items-center px-4 border-b", isCollapsed ? "justify-center" : "justify-between")}>
                    <div className="flex items-center gap-2 animate-fade-in">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        {!isCollapsed && <span className="text-xl font-bold gradient-text">Velocity VPN</span>}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto py-4 px-3">
                <nav className={cn("space-y-1", sidebarDensity === "spacious" && "space-y-2")}>
                    {navigation.map((item) => (
                        <NavLink key={item.name} item={item} isCollapsed={isCollapsed} />
                    ))}
                </nav>
            </div>

            <div className="mt-auto px-4 py-4 text-center">
                {!isCollapsed && (
                    <div className="animate-fade-in opacity-20 hover:opacity-100 transition-opacity duration-300">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Tynybite Labs
                        </h2>
                        <p className="text-xs font-medium text-muted-foreground mt-1">Made with Love ❤️</p>
                    </div>
                )}
            </div>

            <div className="border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                "flex items-center gap-3 w-full rounded-lg p-2 hover:bg-accent transition-all duration-200 hover:scale-105",
                                isCollapsed && "justify-center",
                            )}
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.photoURL || "/placeholder.svg?height=40&width=40"} referrerPolicy="no-referrer" />
                                <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="text-sm font-semibold truncate">{user?.displayName || "User"}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/user-dashboard/profile" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                Profile Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col border-r bg-card transition-all duration-300 relative",
                    collapsed ? "w-20" : "w-64",
                )}
            >
                <Button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 z-20 h-6 w-6 rounded-full border shadow-md p-0 bg-background hover:bg-accent text-muted-foreground hover:text-foreground hidden lg:flex items-center justify-center"
                    variant="ghost"
                >
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </Button>
                <Suspense fallback={<div />}>
                    <SidebarContent isCollapsed={collapsed} />
                </Suspense>
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-72">
                    <SheetHeader className="p-4 border-b text-left">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">Velocity VPN</span>
                        </SheetTitle>
                    </SheetHeader>
                    <Suspense fallback={<div />}>
                        <SidebarContent isCollapsed={false} hideHeader />
                    </Suspense>
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header */}
                <header className="h-16 border-b bg-card px-4 lg:px-6 flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden hover:scale-110 active:scale-95 transition-transform"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex-1 flex items-center gap-4 min-w-0">
                        {/* Search removed for user panel for now, or keep it if search is needed */}
                        <div className="flex-1" />
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-4 min-w-0">

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="relative hover:scale-110 active:scale-95 transition-all"
                            >
                                {mounted ? (
                                    theme === "dark" ? (
                                        <Sun className="h-5 w-5 rotate-0 transition-transform duration-500" />
                                    ) : (
                                        <Moon className="h-5 w-5 rotate-180 transition-transform duration-500" />
                                    )
                                ) : (
                                    <Sun className="h-5 w-5 rotate-0 opacity-0" /> // Placeholder to prevent layout shift
                                )}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative hover:scale-110 active:scale-95 transition-all">
                                        <Bell className="h-5 w-5" />
                                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse">
                                            3
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 animate-scale-in">
                                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="space-y-2 p-2">
                                        {[
                                            { title: "Welcome!", description: "Thanks for joining us.", time: "Just now" },
                                        ].map((notification, i) => (
                                            <div
                                                key={i}
                                                className="p-2 rounded-lg hover:bg-accent cursor-pointer transition-all hover:scale-105"
                                            >
                                                <div className="font-semibold text-sm">{notification.title}</div>
                                                <div className="text-xs text-muted-foreground">{notification.description}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
            </div>
        </div>
    )
}
