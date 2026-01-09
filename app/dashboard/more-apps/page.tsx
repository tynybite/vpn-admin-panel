"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, ExternalLink, Edit, Trash2, Smartphone, Loader2 } from "lucide-react"
import Image from "next/image"
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
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/api-client"

type AppType = {
  id: string
  name: string
  description: string
  playstoreUrl: string
  imageUrl: string
  category: string
  downloads: string
  rating: string
}


function AppFormFields({ formData, setFormData }: { formData: any, setFormData: (data: any) => void }) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">App Name *</Label>
        <Input
          id="name"
          placeholder="Velocity VPN Pro"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the app..."
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="playstoreUrl">Play Store URL *</Label>
        <Input
          id="playstoreUrl"
          placeholder="https://play.google.com/store/apps/details?id=..."
          value={formData.playstoreUrl}
          onChange={(e) => setFormData({ ...formData, playstoreUrl: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">App Icon URL *</Label>
        <Input
          id="imageUrl"
          placeholder="https://example.com/app-icon.png"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="Tools"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="downloads">Downloads</Label>
          <Input
            id="downloads"
            placeholder="100K+"
            value={formData.downloads}
            onChange={(e) => setFormData({ ...formData, downloads: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <Input
            id="rating"
            placeholder="4.5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

export default function MoreAppsPage() {
  const [apps, setApps] = useState<AppType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppType | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    playstoreUrl: "",
    imageUrl: "",
    category: "",
    downloads: "",
    rating: "",
  })

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/app/more-apps") // Public endpoint
      if (res.ok) {
        const data = await res.json()
        setApps(data.apps || [])
      }
    } catch (error) {
      console.error("Failed to fetch apps", error)
      toast.error("Failed to load apps")
    } finally {
      setLoading(false)
    }
  }

  const handleAddApp = async () => {
    try {
      if (!formData.name || !formData.playstoreUrl) {
        toast.error("Name and URL are required")
        return
      }

      const newApp: AppType = {
        id: crypto.randomUUID(), // Generate unique ID
        ...formData,
      }

      // Optimistic update
      const prevApps = [...apps]
      setApps([...apps, newApp])
      setShowAddDialog(false)
      resetForm()

      const res = await fetchWithAuth("/api/admin/more-apps", {
        method: "POST",
        body: JSON.stringify({ app: newApp })
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }
      toast.success("App added successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add app")
      fetchApps() // Revert on error
    }
  }

  const handleEditApp = async () => {
    if (!selectedApp) return
    try {
      const updatedApp = { ...selectedApp, ...formData }

      // Optimistic update
      const prevApps = [...apps]
      setApps(apps.map((app) => (app.id === selectedApp.id ? updatedApp : app)))
      setShowEditDialog(false)
      setSelectedApp(null)
      resetForm()

      const res = await fetchWithAuth("/api/admin/more-apps", {
        method: "PUT",
        body: JSON.stringify({ app: updatedApp })
      })

      if (!res.ok) {
        throw new Error("Failed to update")
      }
      toast.success("App updated successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to update app")
      fetchApps()
    }
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteApp = async () => {
    if (!deleteId) return
    try {
      const prevApps = [...apps]
      setApps(apps.filter((app) => app.id !== deleteId))
      setShowDeleteDialog(false)

      const res = await fetchWithAuth(`/api/admin/more-apps?id=${deleteId}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Failed to delete")
      }
      toast.success("App deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete app")
      fetchApps()
    }
  }

  const openEditDialog = (app: AppType) => {
    setSelectedApp(app)
    setFormData({
      name: app.name,
      description: app.description,
      playstoreUrl: app.playstoreUrl,
      imageUrl: app.imageUrl,
      category: app.category,
      downloads: app.downloads,
      rating: app.rating,
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      playstoreUrl: "",
      imageUrl: "",
      category: "",
      downloads: "",
      rating: "",
    })
  }




  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">More Apps</h1>
            <p className="text-muted-foreground mt-2">Manage your published apps on Google Play Store</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2" disabled={!isAdmin}>
            <Plus className="h-4 w-4" />
            Add App
          </Button>
        </div>

        <AdminAlert />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New App Card */}
          <div
            className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-border/50 hover:border-primary/50 bg-card/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-card/50 min-h-[280px] group"
            onClick={() => isAdmin && setShowAddDialog(true)}
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Add New App</h3>
            <p className="text-sm text-muted-foreground text-center max-w-[200px]">Add another application to your portfolio</p>
          </div>

          {apps.map((app) => (
            <div
              key={app.id}
              className="relative group flex flex-col rounded-[2rem] border p-8 transition-all duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-white/5 bg-card/50 backdrop-blur-sm border-border/50 hover:border-border/80 hover:shadow-lg"
            >
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10 shadow-sm">
                  <Image
                    src={app.imageUrl || "/placeholder.svg"}
                    alt={app.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-xl font-semibold truncate leading-tight mb-2">{app.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs rounded-lg px-2 font-normal">
                      {app.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-amber-400">★</span> {app.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{app.description}</p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium p-3 bg-secondary/30 rounded-xl">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>{app.downloads} active installs</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex gap-3">
                <Button variant="default" size="sm" className="flex-1 gap-2 rounded-xl h-10 shadow-lg shadow-primary/20" asChild>
                  <a href={app.playstoreUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Play Store
                  </a>
                </Button>

                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 border-border/50 hover:bg-secondary"
                      onClick={() => openEditDialog(app)}
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                      onClick={() => confirmDelete(app.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New App</DialogTitle>
            <DialogDescription>Add a new app to your Play Store portfolio</DialogDescription>
          </DialogHeader>
          <AppFormFields formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddApp}>Add App</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
            <DialogDescription>Update app information</DialogDescription>
          </DialogHeader>
          <AppFormFields formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditApp}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the app from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApp} className="bg-destructive hover:bg-destructive/90">
              Delete App
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
