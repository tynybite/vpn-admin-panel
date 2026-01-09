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
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/api-client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"

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
    const matchesGuest = !excludeGuests || user.provider !== "anonymous"
    
    let matchesDate = true
    if (dateRange?.from && user.registrationDate && user.registrationDate !== "Unknown") {
      try {
        const userDate = new Date(user.registrationDate)
        if (!isNaN(userDate.getTime())) {
          if (dateRange.to) {
            matchesDate = isWithinInterval(userDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.to)
            })
          } else {
            matchesDate = isWithinInterval(userDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.from)
            })
          }
        }
      } catch {
        matchesDate = true 
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
        return "bg-background text-foreground border-foreground font-bold"
      case "deleted":
        return "bg-muted text-muted-foreground border-transparent"
      case "premium":
        return "bg-primary text-primary-foreground border-primary font-bold"
      case "suspended":
        return "bg-destructive text-destructive-foreground border-destructive font-bold"
      default:
        return "bg-muted text-muted-foreground border-transparent"
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
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">User Management</h1>
          <p className="text-muted-foreground font-sans text-sm">Control account access and privileges.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-none border shadow-none bg-card hover:border-foreground transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{stats.total}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none border shadow-none bg-card hover:border-foreground transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{stats.active}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none border shadow-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Premium</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{stats.premium}</p>
                </div>
                <Crown className="h-5 w-5 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none border shadow-none bg-card hover:border-foreground transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deleted</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{stats.deleted}</p>
                </div>
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
           <Card className="rounded-none border shadow-none bg-card hover:border-foreground transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold tracking-tight mt-1">{stats.suspended}</p>
                </div>
                <Ban className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-none border shadow-none bg-card">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="SEARCH USERS..."
                    className="pl-9 bg-background uppercase text-xs font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 border-dashed bg-background">
                      <Filter className="h-4 w-4" />
                      FILTERS
                      {(statusFilter.length > 0 || planFilter.length > 0 || roleFilter.length > 0) && (
                        <Badge variant="secondary" className="ml-1 rounded-none px-1 h-5 text-[10px]">
                          {statusFilter.length + planFilter.length + roleFilter.length}
                        </Badge>
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
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-0">
                          {["active", "suspended", "deleted"].map(s => (
                             <DropdownMenuCheckboxItem
                                key={s}
                                checked={statusFilter.includes(s)}
                                onCheckedChange={(checked) =>
                                  setStatusFilter(
                                    checked ? [...statusFilter, s] : statusFilter.filter((f) => f !== s),
                                  )
                                }
                                className="uppercase text-xs"
                              >
                                {s}
                              </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    
                     <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Plan</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-0">
                          {["free", "premium"].map(p => (
                             <DropdownMenuCheckboxItem
                                key={p}
                                checked={planFilter.includes(p)}
                                onCheckedChange={(checked) =>
                                  setPlanFilter(
                                    checked ? [...planFilter, p] : planFilter.filter((f) => f !== p),
                                  )
                                }
                                className="uppercase text-xs"
                              >
                                {p}
                              </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-center font-medium uppercase text-xs"
                      onClick={() => {
                        setStatusFilter([])
                        setPlanFilter([])
                        setRoleFilter([])
                      }}
                    >
                      Clear Filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={excludeGuests ? "secondary" : "outline"}
                  onClick={() => setExcludeGuests(!excludeGuests)}
                  className="gap-2 border-dashed bg-background"
                >
                  <Users className="h-4 w-4" />
                  No Guests
                  {excludeGuests && <CheckCircle2 className="h-4 w-4" />}
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange?.from ? "secondary" : "outline"}
                      className={cn(
                        "gap-2 border-dashed min-w-[200px] justify-start text-left font-normal bg-background uppercase text-xs",
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
                        "Date Range"
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
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                {selectedUids.length > 0 && (
                  <Button
                    variant="destructive"
                    className="gap-2 rounded-none"
                    onClick={() => openActionDialog(null, "delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedUids.length})
                  </Button>
                )}
                <Button variant="outline" className="gap-2 bg-transparent rounded-none border-dashed" onClick={() => loadUsers(true)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent rounded-none border-dashed">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!loading && filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-heading uppercase mb-2">No users found</h3>
                <p className="text-sm text-muted-foreground">
                   Adjust filters to see results.
                </p>
              </div>
            ) : (
              <div className="border-t-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="w-[50px] pl-4">
                        <Checkbox
                          checked={selectedUids.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="rounded-none border-foreground"
                        />
                      </TableHead>
                      <TableHead className="uppercase text-xs font-bold tracking-wider text-muted-foreground">User</TableHead>
                      <TableHead className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Plan</TableHead>
                      <TableHead className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Registered</TableHead>
                      <TableHead className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Usage</TableHead>
                      <TableHead className="text-right uppercase text-xs font-bold tracking-wider text-muted-foreground pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-none" />
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      paginatedUsers.map((user, index) => (
                        <TableRow key={user.uid || user.id || index} className={cn("group border-b border-border hover:bg-muted/30", selectedUids.includes(user.uid || user.id) && "bg-muted/50")}>
                          <TableCell className="pl-4">
                            <Checkbox
                              checked={selectedUids.includes(user.uid || user.id)}
                              onCheckedChange={() => toggleSelectUser(user.uid || user.id)}
                              className="rounded-none border-foreground"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="rounded-none border border-border h-8 w-8 text-xs">
                                <AvatarImage src={user.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.name}`} />
                                <AvatarFallback className="rounded-none bg-secondary font-bold">
                                  {(user.name || "U")[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-sm flex items-center gap-2">
                                  {user.name}
                                  {user.role === "admin" && <Badge variant="secondary" className="text-[10px] h-4 rounded-none px-1">ADMIN</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className={cn("rounded-none px-1.5 py-0.5 text-[10px] uppercase tracking-wider", getStatusColor(user.status))}>
                                {user.status}
                             </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.plan === "premium" ? "default" : "secondary"} className="rounded-none px-1.5 py-0.5 text-[10px] uppercase">
                               {user.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono text-muted-foreground">
                              {(() => {
                                if (!user.registrationDate) return "Unknown"
                                const date = new Date(user.registrationDate)
                                return isNaN(date.getTime()) ? "Unknown" : format(date, "MMM d, yyyy")
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="font-medium">{user.totalConnectionTime || "0h 0m"}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{user.dataTransferred || "0 MB"}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-none border-border">
                                <DropdownMenuItem onClick={() => openDetailDialog(user)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                {/* @ts-ignore */}
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
                                      className="text-destructive focus:text-destructive"
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
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-none px-2"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono mx-2">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                   className="h-8 rounded-none px-2"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-none border border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-tight text-xl">User Details</DialogTitle>
              <DialogDescription>Full account profile and metadata.</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50 p-1">
                  <TabsTrigger value="account" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border">Account</TabsTrigger>
                  <TabsTrigger value="usage" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border">Usage</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border">History</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="space-y-4 pt-4">
                  <div className="flex items-center gap-4 p-4 border border-border bg-muted/10">
                    <Avatar className="h-16 w-16 rounded-none border border-border">
                      <AvatarImage src={selectedUser.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedUser.name}`} />
                      <AvatarFallback className="text-xl font-bold bg-background rounded-none">
                        {(selectedUser.name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold uppercase">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{selectedUser.email}</p>
                    </div>
                    <Badge variant="outline" className={cn("rounded-none px-2 py-1 uppercase", getStatusColor(selectedUser.status))}>
                      {selectedUser.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 border border-border bg-card">
                       <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Subscription</Label>
                       <div className="font-bold uppercase tracking-tight">{selectedUser.plan}</div>
                     </div>
                     <div className="p-3 border border-border bg-card">
                       <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Registered</Label>
                       <div className="font-mono text-sm">{selectedUser.registrationDate}</div>
                     </div>
                     <div className="p-3 border border-border bg-card">
                       <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Last Login</Label>
                       <div className="font-mono text-sm">{selectedUser.lastLogin}</div>
                     </div>
                     <div className="p-3 border border-border bg-card">
                       <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Devices</Label>
                       <div className="font-bold">{selectedUser.deviceCount} <span className="text-muted-foreground font-normal text-xs">connected</span></div>
                     </div>
                  </div>
                </TabsContent>
                <TabsContent value="usage" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-none border shadow-none">
                      <CardContent className="pt-6 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Total Time</p>
                          <p className="text-2xl font-bold">{selectedUser.totalConnectionTime}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-none border shadow-none">
                      <CardContent className="pt-6 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Data Transferred</p>
                          <p className="text-2xl font-bold">{selectedUser.dataTransferred}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="space-y-4 pt-4">
                  <div className="border border-dashed border-border p-8 text-center bg-muted/10">
                    <p className="text-sm text-muted-foreground">Activity logs unavailable.</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="rounded-none border border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-tight">
                {actionType === "suspend" && "Suspend Account"}
                {actionType === "grant" && "Grant Premium"}
                {actionType === "delete" && "Delete Account"}
                {actionType === "revoke_premium" && "Revoke Premium"}
                {actionType === "send_email" && "Send Email"}
                {actionType === "make_admin" && "Grant Admin Access"}
                {actionType === "remove_admin" && "Revoke Admin Access"}
              </DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground mt-2">
                {actionType === "suspend" && "Prevent user from accessing services."}
                {actionType === "grant" && "Grant complimentary premium access."}
                {actionType === "delete" && "Permanently delete user data."}
                {actionType === "send_email" && "Send a personalized notification."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {actionType === "send_email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs uppercase">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Email Subject"
                      className="rounded-none bg-muted/20"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs uppercase">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message..."
                      className="min-h-[150px] rounded-none bg-muted/20"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {actionType === "grant" && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-xs uppercase">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={actionForm.duration}
                    onChange={(e) => setActionForm({ ...actionForm, duration: e.target.value })}
                    className="rounded-none"
                  />
                </div>
              )}

              {actionType === "delete" && (selectedUser || selectedUids.length > 0) && (
                <div className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm text-destructive font-bold uppercase mb-2">Irreversible Action</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUids.length > 0 ? (
                        <>You are deleting <strong>{selectedUids.length}</strong> accounts.</>
                      ) : (
                        <>You are deleting <strong>{selectedUser?.name}</strong>.</>
                      )}
                    </p>
                    <div className="mt-4">
                        <Label htmlFor="confirm" className="text-xs uppercase block mb-2">Type "{selectedUids.length > 0 ? "DELETE ALL" : selectedUser?.email}" to confirm</Label>
                        <Input
                          id="confirm"
                          placeholder="CONFIRMATION..."
                          value={confirmInput}
                          onChange={(e) => setConfirmInput(e.target.value)}
                          className="border-destructive/50 focus-visible:ring-destructive rounded-none bg-background"
                        />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={() => setShowActionDialog(false)} className="rounded-none flex-1">
                Cancel
              </Button>
              <Button
                variant={actionType === "delete" ? "destructive" : "default"}
                onClick={handleAction}
                disabled={isActionProcessing || (actionType === "delete" && confirmInput !== (selectedUids.length > 0 ? "DELETE ALL" : selectedUser?.email))}
                className="rounded-none flex-1"
              >
                Confirm Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
