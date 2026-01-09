"use client"

import { useState, useEffect } from "react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CacheService } from "@/lib/cache-service"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MoreHorizontal,
  Search,
  CheckCircle2,
  Ban,
  Crown,
  Trash2,
  Download,
  Filter,
  Shield,
  Clock,
  Zap,
  UserCog,
  Mail,
  Eye,
  Users,
  XCircle,
  Activity,
  MoreVertical,
  RefreshCw,
  CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
// Removed direct import from user-service, using fetch now
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/api-client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

// Define UserData locally or import shared type
export interface UserData {
  id: string
  uid?: string
  name: string
  email: string
  avatar?: string
  role: "admin" | "user"
  status: "active" | "deleted" | "premium" | "suspended"
  plan: "free" | "basic" | "premium"
  registrationDate: string
  lastLogin: string
  provider?: string
  totalConnectionTime?: string
  dataTransferred?: string
  deviceCount?: number
}

export default function UsersPage() {

  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [planFilter, setPlanFilter] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [excludeGuests, setExcludeGuests] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [actionType, setActionType] = useState<"suspend" | "unsuspend" | "grant" | "delete" | "make_admin" | "remove_admin" | "revoke_premium" | "send_email" | null>(null)

  const [actionForm, setActionForm] = useState({ duration: "30", reason: "" })
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" })
  const [isActionProcessing, setIsActionProcessing] = useState(false)

  const [selectedUids, setSelectedUids] = useState<string[]>([])
  const [confirmInput, setConfirmInput] = useState("")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async (forceRefresh = false) => {
    try {
      setLoading(true)

      const CACHE_KEY = "admin_users_list";

      if (!forceRefresh) {
        const cachedData = CacheService.get<{ users: any[] }>(CACHE_KEY);
        if (cachedData) {
          setUsers(cachedData.users);
          setLoading(false);
          return;
        }
      }

      const res = await fetchWithAuth("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()

      CacheService.set(CACHE_KEY, data);
      setUsers(data.users)

      if (forceRefresh) {
        toast.success("Refreshed", { description: "User list updated from server" })
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Error", {
        description: "Failed to load users. Please refresh the page.",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(user.status)
    const matchesPlan = planFilter.length === 0 || planFilter.includes(user.plan)
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(user.role)
    // Removed excludeGuests from dependency array in effect, but logic is fine here.
    // Guests check: provider === 'anonymous'
    const matchesGuest = !excludeGuests || user.provider !== "anonymous"
    
    // Date range filter for registration date
    let matchesDate = true
    if (dateRange?.from && user.registrationDate && user.registrationDate !== "Unknown") {
      try {
        // Parse user registration date - Date constructor handles most formats:
        // "1/9/2026", "Jan 9, 2026", "2026-01-09", etc.
        const userDate = new Date(user.registrationDate)
        
        // Check if date is valid
        if (!isNaN(userDate.getTime())) {
          if (dateRange.to) {
            matchesDate = isWithinInterval(userDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.to)
            })
          } else {
            // Single date selected - match that specific day
            matchesDate = isWithinInterval(userDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.from)
            })
          }
        }
      } catch {
        matchesDate = true // If date parsing fails, include the user
      }
    }
    
    return matchesSearch && matchesStatus && matchesPlan && matchesRole && matchesGuest && matchesDate
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
    setSelectedUids([]) // Clear selection when filters change
  }, [searchQuery, statusFilter, planFilter, roleFilter, excludeGuests, dateRange])

  const toggleSelectAll = () => {
    if (selectedUids.length === paginatedUsers.length) {
      setSelectedUids([])
    } else {
      setSelectedUids(paginatedUsers.map(u => u.uid || u.id))
    }
  }

  const toggleSelectUser = (uid: string) => {
    setSelectedUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "deleted":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "premium":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "suspended":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3" />
      case "deleted":
        return <Trash2 className="h-3 w-3" />
      case "premium":
        return <Crown className="h-3 w-3" />
      case "suspended":
        return <Ban className="h-3 w-3" />
      default:
        return null
    }
  }

  const openDetailDialog = (user: UserData) => {
    setSelectedUser(user)
    setShowDetailDialog(true)
  }

  const openActionDialog = (user: UserData | null, action: "suspend" | "unsuspend" | "grant" | "delete" | "make_admin" | "remove_admin" | "revoke_premium" | "send_email") => {
    setSelectedUser(user)
    setActionType(action)
    setConfirmInput("")
    setActionForm({ duration: "30", reason: "" })
    setEmailForm({ subject: "", message: "" })
    setShowActionDialog(true)
  }

  const handleAction = async () => {
    if (!actionType || (!selectedUser && selectedUids.length === 0)) return
    setIsActionProcessing(true)

    // Confirmation check for delete
    if (actionType === "delete") {
      const expectedConfirm = selectedUids.length > 0 ? "DELETE ALL" : selectedUser?.email;
      if (confirmInput !== expectedConfirm) {
        toast.error("Invalid confirmation", { description: "Please type the exact confirmation text." });
        return;
      }
    }

    try {
      let endpoint = "/api/admin/users"
      let method = "PUT"
      let payload: any = { uid: selectedUser?.id || selectedUser?.uid } // Handle both id formats

      if (actionType === "suspend") {
        payload.action = "ban"
      } else if (actionType === "unsuspend") {
        payload.action = "unban"
      } else if (actionType === "grant") {
        payload.action = "set_plan"
        payload.payload = { plan: "premium" }
      } else if (actionType === "revoke_premium") {
        payload.action = "set_plan"
        payload.payload = { plan: "free" }
      } else if (actionType === "make_admin") {
        payload.action = "set_role"
        payload.payload = { role: "admin" }
      } else if (actionType === "remove_admin") {
        payload.action = "set_role"
        payload.payload = { role: "user" }
      } else if (actionType === "send_email") {
        endpoint = "/api/admin/users/email"
        method = "POST"
        payload = {
          uid: selectedUser?.id || selectedUser?.uid,
          subject: emailForm.subject,
          message: emailForm.message
        }
      }

      // For delete, we call our new hard delete API
      if (actionType === "delete") {
        const uidsString = selectedUids.length > 0 ? selectedUids.join(",") : (selectedUser?.id || selectedUser?.uid);
        const queryParam = selectedUids.length > 0 ? `uids=${uidsString}` : `uid=${uidsString}`;

        const deleteRes = await fetchWithAuth(`/api/admin/users?${queryParam}`, {
          method: "DELETE",
        })

        if (!deleteRes.ok) {
          const errorData = await deleteRes.json()
          throw new Error(errorData.error || "Failed to delete user(s)")
        }

        toast.success("Success", {
          description: `User(s) deleted permanently.`
        })
        setSelectedUids([])
        loadUsers(true) // Force refresh to update cache
        setShowActionDialog(false)
        setConfirmInput("")
        return
      }

      const res = await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      const data = await res.json()
      toast.success("Success", {
        description: `User updated successfully. Logged as: ${data.debug?.admin}`
      })
      loadUsers(true) // Force refresh to see changes

      setShowActionDialog(false)
      setConfirmInput("")
      setActionForm({ duration: "30", reason: "" })
    } catch (error: any) {
      console.error("Error performing action:", error)
      toast.error("Error", {
        description: error.message || "Failed to perform action.",
      })
    } finally {
      setIsActionProcessing(false)
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    premium: users.filter((u) => u.plan === "premium" || u.status === "premium").length,
    deleted: users.filter((u) => u.status === "deleted").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage user accounts and subscriptions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl dark:border dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl dark:border dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl dark:border dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Premium</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.premium}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Crown className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl dark:border dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Deleted</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.deleted}</p>
                </div>
                <div className="w-12 h-12 bg-gray-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Trash2 className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl dark:border dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Suspended</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.suspended}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Ban className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem] border-0 shadow-sm bg-card/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 rounded-xl border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-dashed">
                      <Filter className="h-4 w-4" />
                      Filters
                      {(statusFilter.length > 0 || planFilter.length > 0 || roleFilter.length > 0) && (
                        <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal lg:hidden">
                          {statusFilter.length + planFilter.length + roleFilter.length}
                        </Badge>
                      )}
                      {(statusFilter.length > 0 || planFilter.length > 0 || roleFilter.length > 0) && (
                        <div className="hidden lg:flex gap-1 ml-1">
                          {statusFilter.length > 0 && (
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                              {statusFilter.length} status
                            </Badge>
                          )}
                          {planFilter.length > 0 && (
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                              {planFilter.length} plan
                            </Badge>
                          )}
                          {roleFilter.length > 0 && (
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                              {roleFilter.length} role
                            </Badge>
                          )}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Activity className="mr-2 h-4 w-4" />
                        <span>Status</span>
                        {statusFilter.length > 0 && (
                          <span className="ml-auto mr-2 flex h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-0">
                          <DropdownMenuCheckboxItem
                            checked={statusFilter.includes("active")}
                            onCheckedChange={(checked) =>
                              setStatusFilter(
                                checked ? [...statusFilter, "active"] : statusFilter.filter((s) => s !== "active"),
                              )
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Active
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={statusFilter.includes("suspended")}
                            onCheckedChange={(checked) =>
                              setStatusFilter(
                                checked ? [...statusFilter, "suspended"] : statusFilter.filter((s) => s !== "suspended"),
                              )
                            }
                          >
                            <Ban className="mr-2 h-4 w-4 text-red-500" />
                            Suspended
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={statusFilter.includes("deleted")}
                            onCheckedChange={(checked) =>
                              setStatusFilter(
                                checked ? [...statusFilter, "deleted"] : statusFilter.filter((s) => s !== "deleted"),
                              )
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                            Deleted
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Plan</span>
                        {planFilter.length > 0 && (
                          <span className="ml-auto mr-2 flex h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-0">
                          <DropdownMenuCheckboxItem
                            checked={planFilter.includes("free")}
                            onCheckedChange={(checked) =>
                              setPlanFilter(checked ? [...planFilter, "free"] : planFilter.filter((t) => t !== "free"))
                            }
                          >
                            <Zap className="mr-2 h-4 w-4 text-blue-500" />
                            Free
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={planFilter.includes("premium")}
                            onCheckedChange={(checked) =>
                              setPlanFilter(checked ? [...planFilter, "premium"] : planFilter.filter((t) => t !== "premium"))
                            }
                          >
                            <Crown className="mr-2 h-4 w-4 text-purple-500" />
                            Premium
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Role</span>
                        {roleFilter.length > 0 && (
                          <span className="ml-auto mr-2 flex h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-0">
                          <DropdownMenuCheckboxItem
                            checked={roleFilter.includes("admin")}
                            onCheckedChange={(checked) =>
                              setRoleFilter(checked ? [...roleFilter, "admin"] : roleFilter.filter((r) => r !== "admin"))
                            }
                          >
                            <Shield className="mr-2 h-4 w-4 text-red-500" />
                            Admin
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={roleFilter.includes("user")}
                            onCheckedChange={(checked) =>
                              setRoleFilter(checked ? [...roleFilter, "user"] : roleFilter.filter((r) => r !== "user"))
                            }
                          >
                            <UserCog className="mr-2 h-4 w-4 text-gray-500" />
                            User
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    {(statusFilter.length > 0 || planFilter.length > 0 || roleFilter.length > 0) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="justify-center text-center font-medium"
                          onClick={() => {
                            setStatusFilter([])
                            setPlanFilter([])
                            setRoleFilter([])
                          }}
                        >
                          Clear Filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={excludeGuests ? "secondary" : "outline"}
                  onClick={() => setExcludeGuests(!excludeGuests)}
                  className="gap-2 border-dashed"
                >
                  <Users className="h-4 w-4" />
                  Exclude Guests
                  {excludeGuests && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange?.from ? "secondary" : "outline"}
                      className={cn(
                        "gap-2 border-dashed min-w-[200px] justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Registration Date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                    {dateRange?.from && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => setDateRange(undefined)}
                        >
                          Clear Date Filter
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                {selectedUids.length > 0 && (
                  <Button
                    variant="destructive"
                    className="gap-2 rounded-xl"
                    onClick={() => openActionDialog(null, "delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedUids.length})
                  </Button>
                )}
                <Button variant="outline" className="gap-2 bg-transparent rounded-xl border-dashed" onClick={() => loadUsers(true)}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent rounded-xl border-dashed">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!loading && filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter.length > 0 || planFilter.length > 0
                    ? "Try adjusting your filters"
                    : "Users will appear here once they register"}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden bg-background/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedUids.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      paginatedUsers.map((user, index) => (
                        <TableRow key={user.uid || user.id || index} className={cn(selectedUids.includes(user.uid || user.id) && "bg-muted/50")}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUids.includes(user.uid || user.id)}
                              onCheckedChange={() => toggleSelectUser(user.uid || user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.name}`} />
                                <AvatarFallback>
                                  {(user.name || "User")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {user.name}
                                  {user.role === "admin" && <Badge variant="secondary" className="text-[10px] h-4">Admin</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">{user.provider}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", getStatusColor(user.status))}>
                              {getStatusIcon(user.status)}
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.plan === "premium" ? (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
                            ) : user.plan === "basic" ? (
                              <Badge variant="secondary">Basic</Badge>
                            ) : (
                              <Badge variant="outline">Free</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(() => {
                                if (!user.registrationDate) return "Unknown"
                                const date = new Date(user.registrationDate)
                                return isNaN(date.getTime()) ? "Unknown" : format(date, "MMM d, yyyy")
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(() => {
                                if (!user.lastLogin) return "Never"
                                const date = new Date(user.lastLogin)
                                return isNaN(date.getTime()) ? "Never" : format(date, "MMM d, yyyy")
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{user.totalConnectionTime}</div>
                              <div className="text-muted-foreground">{user.dataTransferred}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetailDialog(user)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                {/* Admin Actions Only - Checked via role */}
                                {/* @ts-ignore - Check for role existence */}
                                {currentUser?.role === "admin" && (
                                  <>
                                    <DropdownMenuItem onClick={() => openActionDialog(user, "send_email")}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user.plan !== "premium" && user.status !== "premium" && (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "grant")}>
                                        <Crown className="mr-2 h-4 w-4" />
                                        Grant Premium
                                      </DropdownMenuItem>
                                    )}
                                    {(user.plan === "premium" || user.status === "premium") && (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "revoke_premium")}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Remove Premium
                                      </DropdownMenuItem>
                                    )}
                                    {user.status !== "suspended" && (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "suspend")}>
                                        <Ban className="mr-2 h-4 w-4" />
                                        Ban User
                                      </DropdownMenuItem>
                                    )}
                                    {user.status === "suspended" && (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "unsuspend")}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Reactivate Account
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {user.role !== "admin" ? (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "make_admin")}>
                                        <Crown className="mr-2 h-4 w-4" />
                                        Make Admin
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => openActionDialog(user, "remove_admin")}>
                                        <Ban className="mr-2 h-4 w-4" />
                                        Remove Admin
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => openActionDialog(user, "delete")}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Account
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium mx-2">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Comprehensive user account information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedUser.name}`} />
                      <AvatarFallback className="text-xl">
                        {(selectedUser.name || "User")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Subscription Plan</Label>
                      <div className="font-semibold capitalize">{selectedUser.plan}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Registered</Label>
                      <div className="font-semibold">{selectedUser.registrationDate}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Last Login</Label>
                      <div className="font-semibold">{selectedUser.lastLogin}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Device Count</Label>
                      <div className="font-semibold">{selectedUser.deviceCount} devices</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="usage" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Total Connection Time</p>
                          <p className="text-3xl font-bold">{selectedUser.totalConnectionTime}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Data Transferred</p>
                          <p className="text-3xl font-bold">{selectedUser.dataTransferred}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Connection history and activity logs would appear here.</p>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "suspend" && "Suspend User Account"}
                {actionType === "grant" && "Grant Premium Access"}
                {actionType === "delete" && "Delete User Account"}
                {actionType === "revoke_premium" && "Remove Premium Access"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "suspend" &&
                  "This will prevent the user from accessing their account. You can unsuspend them later."}
                {actionType === "grant" && "Grant this user complimentary premium access for a specified duration."}
                {actionType === "delete" && "This action is irreversible and will permanently delete all user data."}
                {actionType === "make_admin" && "This user will have full access to the dashboard."}
                {actionType === "remove_admin" && "This user will lose admin privileges."}
                {actionType === "unsuspend" && "This user will be able to access the app again."}
                {actionType === "revoke_premium" && "This will revert the user to the free tier immediately."}
                {actionType === "send_email" && "Send a custom email notification to this user."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {actionType === "send_email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your message here..."
                      className="min-h-[150px]"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {actionType === "grant" && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={actionForm.duration}
                    onChange={(e) => setActionForm({ ...actionForm, duration: e.target.value })}
                  />
                </div>
              )}

              {(actionType === "suspend" || actionType === "grant") && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason / Notes</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for this action..."
                    value={actionForm.reason}
                    onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })}
                  />
                </div>
              )}

              {actionType === "delete" && (selectedUser || selectedUids.length > 0) && (
                <div className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive font-semibold mb-2">Warning: This cannot be undone</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUids.length > 0 ? (
                        <>Permanent deletion of <strong>{selectedUids.length}</strong> accounts.</>
                      ) : (
                        <>Permanent deletion of <strong>{selectedUser?.name}</strong>'s account.</>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please type <code className="bg-background px-1 py-0.5 rounded">{selectedUids.length > 0 ? "DELETE ALL" : selectedUser?.email}</code> to confirm.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmation</Label>
                    <Input
                      id="confirm"
                      placeholder="Type to confirm..."
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      className="border-destructive/20 focus-visible:ring-destructive"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === "delete" ? "destructive" : "default"}
                onClick={handleAction}
                disabled={isActionProcessing || (actionType === "delete" && confirmInput !== (selectedUids.length > 0 ? "DELETE ALL" : selectedUser?.email))}
              >
                {/* {isActionProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                {actionType === "suspend" && "Suspend Account"}
                {actionType === "unsuspend" && "Unsuspend Account"}
                {actionType === "grant" && "Grant Premium"}
                {actionType === "delete" && "Delete Account"}
                {actionType === "make_admin" && "Make Admin"}
                {actionType === "remove_admin" && "Remove Admin"}
                {actionType === "revoke_premium" && "Remove Premium"}
                {actionType === "send_email" && "Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
