"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,

} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Search, Trash2, Eye, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AdminAlert } from "@/components/admin-alert"
import { Switch } from "@/components/ui/switch"

type NotificationType = {
  id: string
  title: string
  message: string
  target: string
  status: string
  sentAt: string
  recipients: number
  delivered: number
  opened: number
  fcmMessageId?: string
}


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "all",
    scheduleDate: "",
    scheduleTime: "",
    priority: "high",
    image_url: "",
    cta_text: "",
    cta_url: "",
    min_version: "",
    max_version: "",
    dismissible: true,
  })

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
      toast.error("Error", { description: "Failed to load notification history" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter(
    (notif) =>
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Error", { description: "Title and message are required" })
      return
    }

    try {
      setSending(true)
      const res = await fetchWithAuth("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to send")

      const data = await res.json()

      toast.success(formData.scheduleDate ? "Scheduled" : "Sent", {
        description: formData.scheduleDate ? "Notification scheduled successfully" : "Notification sent successfully"
      })

      setShowSendDialog(false)
      setFormData({
        title: "",
        message: "",
        target: "all",
        scheduleDate: "",
        scheduleTime: "",
        priority: "high",
        image_url: "",
        cta_text: "",
        cta_url: "",
        min_version: "",
        max_version: "",
        dismissible: true,
      })
      fetchNotifications() // Refresh list
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error("Error", { description: "Failed to send notification" })
    } finally {
      setSending(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteNotification = async () => {
    if (!deleteId) return

    try {
      const res = await fetchWithAuth(`/api/admin/notifications/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Deleted", { description: "Notification history deleted" })
        setNotifications((prev) => prev.filter((n) => n.id !== deleteId))
        setShowDeleteDialog(false)
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to delete notification" })
    }
  }

  const handleViewNotification = (notification: NotificationType) => {
    setSelectedNotification(notification)
    setShowViewDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case "scheduled":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Push Notifications</h1>
          <p className="text-muted-foreground mt-2">Send notifications to your users via Firebase FCM</p>
        </div>

        <AdminAlert />

        <div className="flex items-center justify-end">
          <Button onClick={() => setShowSendDialog(true)} className="gap-2" disabled={!isAdmin}>
            <Send className="h-4 w-4" />
            Send Notification
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,665</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.7%</div>
              <p className="text-xs text-muted-foreground mt-1">11,645 / 11,680 delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.4%</div>
              <p className="text-xs text-muted-foreground mt-1">7,965 notifications opened</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Notification History</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{notification.message}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {notification.target}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={((notification as any).priority === "high") ? "destructive" : "secondary"} className="capitalize">
                              {(notification as any).priority || "high"}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(notification.status)}</TableCell>
                          <TableCell className="text-sm">{notification.sentAt}</TableCell>
                          <TableCell>{(notification.recipients ?? 0).toLocaleString()}</TableCell>
                          <TableCell>{(notification.delivered ?? 0).toLocaleString()}</TableCell>
                          <TableCell>{(notification.opened ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleViewNotification(notification)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => confirmDelete(notification.id)}
                                disabled={!isAdmin}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div >

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Push Notification</DialogTitle>
            <DialogDescription>Create and send a notification to your users via Firebase FCM</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="compose" className="w-full">
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="targeting">Targeting</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-4">
              <TabsContent value="compose" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title *</Label>
                  <Input
                    id="title"
                    placeholder="New Feature Available"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell your users about what's new..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground text-right">{formData.message.length} / 200</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL (Optional)</Label>
                  <Input
                    id="image_url"
                    placeholder="https://example.com/image.png"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_text">CTA Text (Optional)</Label>
                    <Input
                      id="cta_text"
                      placeholder="Learn More"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta_url">CTA URL (Optional)</Label>
                    <Input
                      id="cta_url"
                      placeholder="https://example.com/promo"
                      value={formData.cta_url}
                      onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Audience *</Label>
                  <Select value={formData.target} onValueChange={(value) => setFormData({ ...formData, target: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users (5,420)</SelectItem>
                      <SelectItem value="premium">Premium Users (1,245)</SelectItem>
                      <SelectItem value="free">Free Users (3,200)</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (Immediate)</SelectItem>
                      <SelectItem value="normal">Normal (Battery Optimized)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_version">Min Version (Optional)</Label>
                    <Input
                      id="min_version"
                      placeholder="1.0.0"
                      value={formData.min_version}
                      onChange={(e) => setFormData({ ...formData, min_version: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_version">Max Version (Optional)</Label>
                    <Input
                      id="max_version"
                      placeholder="9.9.9"
                      value={formData.max_version}
                      onChange={(e) => setFormData({ ...formData, max_version: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="dismissible"
                    checked={formData.dismissible}
                    onCheckedChange={(checked) => setFormData({ ...formData, dismissible: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="dismissible">Dismissible</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to dismiss this notification
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Date</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-foreground">Scheduling Note</span>
                  </div>
                  Notifications without a schedule are sent immediately. Scheduled notifications will be processed by the system scheduler within 5 minutes of the target time.
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} className="gap-2">
              <Send className="h-4 w-4" />
              {formData.scheduleDate ? "Schedule" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Title</Label>
                <div className="font-medium text-lg">{selectedNotification.title}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Message</Label>
                <div className="bg-muted p-3 rounded-md text-sm mt-1">{selectedNotification.message}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Target</Label>
                  <div><Badge variant="outline">{selectedNotification.target}</Badge></div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedNotification.status)}</div>
                </div>
              </div>
              {selectedNotification.fcmMessageId && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">FCM Message ID</Label>
                  <div className="font-mono text-xs bg-slate-950 text-slate-50 p-2 rounded mt-1 break-all">
                    {selectedNotification.fcmMessageId}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    * This ID confirms that Firebase accepted the message request.
                  </p>
                </div>
              )}
              <div className="pt-2 text-xs text-muted-foreground">
                Sent: {selectedNotification.sentAt}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this notification record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
