"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Power, Loader2, List, Grid3x3, Globe } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getServers, deleteServer, updateServer, type ServerData } from "@/lib/server-service"

import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"

export default function ServersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [servers, setServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await getServers()
        setServers(data)
      } catch (error) {
        console.error("Error fetching servers:", error)
        toast.error("Error loading servers", {
          description: "Could not fetch servers from database",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchServers()
  }, [])

  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.country.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(server.status)
    const matchesTier = tierFilter.length === 0 || tierFilter.includes(server.tier)
    return matchesSearch && matchesStatus && matchesTier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "offline":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "maintenance":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return "bg-emerald-500"
    if (load < 80) return "bg-amber-500"
    return "bg-destructive"
  }

  const handleToggleStatus = async (server: ServerData) => {
    try {
      const newStatus = !server.isActive
      if (server.id) {
        await updateServer(server.id, { isActive: newStatus })
        setServers(servers.map((s) => (s.id === server.id ? { ...s, isActive: newStatus } : s)))
        toast.success(newStatus ? "Server activated" : "Server deactivated", {
          description: `${server.name} is now ${newStatus ? "active" : "inactive"}`,
        })
      }
    } catch (error) {
      console.error("Error updating server status:", error)
      toast.error("Error updating status", {
        description: "Could not update server status",
      })
    }
  }

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id)
    setDeleteName(name)
    setShowDeleteDialog(true)
  }

  const handleDeleteServer = async () => {
    if (!deleteId) return

    try {
      await deleteServer(deleteId)
      setServers(servers.filter((server) => server.id !== deleteId))
      toast.success("Server deleted", {
        description: `${deleteName} has been removed`,
      })
      setShowDeleteDialog(false)
      setDeleteId(null)
      setDeleteName("")
    } catch (error) {
      console.error("Error deleting server:", error)
      toast.error("Error deleting server", {
        description: "Could not delete the server",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Server Management</h1>
          <p className="text-muted-foreground font-sans text-sm">Monitor and configure network nodes.</p>
        </div>

        <AdminAlert />

        <div className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search query..."
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-background border-dashed">
                      <Filter className="h-4 w-4" />
                      Filters
                      {(statusFilter.length > 0 || tierFilter.length > 0) && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                          {statusFilter.length + tierFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes("online")}
                      onCheckedChange={(checked) =>
                        setStatusFilter(
                          checked ? [...statusFilter, "online"] : statusFilter.filter((s) => s !== "online"),
                        )
                      }
                    >
                      Online
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes("offline")}
                      onCheckedChange={(checked) =>
                        setStatusFilter(
                          checked ? [...statusFilter, "offline"] : statusFilter.filter((s) => s !== "offline"),
                        )
                      }
                    >
                      Offline
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes("maintenance")}
                      onCheckedChange={(checked) =>
                        setStatusFilter(
                          checked ? [...statusFilter, "maintenance"] : statusFilter.filter((s) => s !== "maintenance"),
                        )
                      }
                    >
                      Maintenance
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Tier</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={tierFilter.includes("free")}
                      onCheckedChange={(checked) =>
                        setTierFilter(checked ? [...tierFilter, "free"] : tierFilter.filter((t) => t !== "free"))
                      }
                    >
                      Free
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={tierFilter.includes("premium")}
                      onCheckedChange={(checked) =>
                        setTierFilter(checked ? [...tierFilter, "premium"] : tierFilter.filter((t) => t !== "premium"))
                      }
                    >
                      Premium
                    </DropdownMenuCheckboxItem>
                    {(statusFilter.length > 0 || tierFilter.length > 0) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setStatusFilter([])
                            setTierFilter([])
                          }}
                        >
                          Clear Filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex border border-border bg-muted/20 p-1 gap-1">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("px-2.5 h-7", viewMode === "table" ? "bg-background shadow-sm" : "")}
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("px-2.5 h-7", viewMode === "grid" ? "bg-background shadow-sm" : "")}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <Link href="/dashboard/servers/add">
                    <Button className="w-full lg:w-auto shadow-none" disabled={!isAdmin}>
                      <Plus className="mr-2 h-4 w-4" /> Add Server
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            {filteredServers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No servers found.</p>
                {isAdmin && (
                  <Link href="/dashboard/servers/add">
                    <Button className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Server
                    </Button>
                  </Link>
                )}
              </div>
            ) : viewMode === "table" ? (
              <div className="border-t-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Server</TableHead>
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Location</TableHead>
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Address</TableHead>
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Load</TableHead>
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Status</TableHead>
                      <TableHead className="font-bold uppercase text-xs tracking-wider">Tier</TableHead>
                      <TableHead className="text-right font-bold uppercase text-xs tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServers.map((server) => (
                      <TableRow key={server.id} className="group hover:bg-muted/20 border-b border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">
                              {server.country.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{server.name}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{server.protocol}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-xl leading-none">{server.flag}</span>
                            <span className="font-medium">{server.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                            {server.ip}:{server.port}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[100px]">
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                              <span>{server.load}%</span>
                              <span>
                                {server.currentUsers}/{server.maxCapacity}
                              </span>
                            </div>
                            <Progress value={server.load} className={cn("h-1.5 bg-secondary", getLoadColor(server.load).replace('bg-', 'text-'))} indicatorClassName={getLoadColor(server.load)} />
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider", getStatusColor(server.isActive === false ? "offline" : server.status))}>
                              {server.isActive === false ? "Inactive" : server.status}
                           </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={server.tier === "premium" ? "default" : "secondary"} className="uppercase text-[10px]">{server.tier}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/dashboard/servers/edit/${server.id}`}>
                                <DropdownMenuItem disabled={!isAdmin}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem onClick={() => handleToggleStatus(server)} disabled={!isAdmin}>
                                <Power className="h-4 w-4 mr-2" />
                                {server.isActive === false ? "Activate" : "Deactivate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(server.id!, server.name)}
                                disabled={!isAdmin}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredServers.map((server) => (
                  <Card key={server.id} className="group border-border shadow-none hover:border-primary transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">
                            {server.country.substring(0,2).toUpperCase()}
                         </div>
                         <div>
                            <h3 className="font-semibold text-sm">{server.name}</h3>
                            <p className="text-xs text-muted-foreground">{server.country}</p>
                         </div>
                       </div>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleToggleStatus(server)} disabled={!isAdmin}>
                             <Power className="h-4 w-4 mr-2" />
                             {server.isActive ? "Deactivate" : "Activate"}
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <Link href={`/dashboard/servers/edit/${server.id}`}>
                              <DropdownMenuItem disabled={!isAdmin}>
                                 <Edit className="h-4 w-4 mr-2" />
                                 Edit Details
                              </DropdownMenuItem>
                           </Link>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => confirmDelete(server.id!, server.name)}
                              disabled={!isAdmin}
                           >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/30 p-2 border border-border">
                             <span className="text-muted-foreground block text-[10px] uppercase">IP Address</span>
                             <span className="font-mono">{server.ip}:{server.port}</span>
                          </div>
                          <div className="bg-muted/30 p-2 border border-border">
                             <span className="text-muted-foreground block text-[10px] uppercase">Protocol</span>
                             <span className="font-medium">{server.protocol}</span>
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                             <span>Load</span>
                             <span>{server.load}%</span>
                          </div>
                          <Progress value={server.load} className={cn("h-1.5 bg-secondary", getLoadColor(server.load).replace('bg-', 'text-'))} indicatorClassName={getLoadColor(server.load)} />
                       </div>

                       <div className="flex items-center justify-between pt-2">
                          <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider", getStatusColor(server.isActive === false ? "offline" : server.status))}>
                             {server.isActive === false ? "Inactive" : server.status}
                          </Badge>
                          <Badge variant={server.tier === "premium" ? "default" : "secondary"} className="uppercase text-[10px]">{server.tier}</Badge>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteServer} className="bg-destructive hover:bg-destructive/90">
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
