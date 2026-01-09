"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Mail, Phone, MapPin, Shield, Key, Smartphone, Copy, Check, Camera, Loader2, Save } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import type { ActivityLog } from "@/lib/auth-service"

export default function ProfilePage() {
  const [copied, setCopied] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  const { user, updateProfile, updatePassword, getRecentActivity } = useAuth()


  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    bio: ""
  })

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  // Load User Data
  useEffect(() => {
    if (user) {
      const names = user.displayName ? user.displayName.split(' ') : ["", ""]
      setFormData({
        firstName: names[0] || "",
        lastName: names.slice(1).join(' ') || "",
        phone: user.phoneNumber || "",
        location: user.location || "",
        bio: user.bio || ""
      })
      loadActivity()
    }
  }, [user])

  const loadActivity = async () => {
    try {
        const logs = await getRecentActivity()
        setActivityLogs(logs || [])
    } catch (error) {
        console.error("Failed to load activity", error)
    }
  }

  const handleCopyBackupCode = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        phoneNumber: formData.phone,
        location: formData.location,
        bio: formData.bio
      })
      toast.success("Profile Updated", {
        description: "Your account details have been successfully saved."
      })
      loadActivity() // Refresh activity log
    } catch (error) {
      toast.error("Update Failed", {
        description: "Could not update your profile. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Passwords do not match", {
        description: "Please ensure your new password matches the confirmation.",
      })
      return
    }

    if (passwordData.new.length < 6) {
      toast.error("Password too weak", {
        description: "Password should be at least 6 characters.",
      })
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(passwordData.current, passwordData.new)
      toast.success("Password Changed", {
        description: "Your password has been updated securely."
      })
      setPasswordData({ current: "", new: "", confirm: "" })
      loadActivity()
    } catch (error: any) {
      console.error(error)
      toast.error("Update Failed", {
        description: error.message || "Please check your current password and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const backupCodes = ["ABCD-1234-EFGH-5678", "IJKL-9012-MNOP-3456", "QRST-7890-UVWX-1234", "YZAB-5678-CDEF-9012"]

  return (

    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-heading font-bold uppercase tracking-tight">Profile Settings</h1>
        <div className="flex items-center gap-2 mt-2">
             <div className="h-1 w-12 bg-primary"></div>
            <p className="text-muted-foreground font-sans text-sm">Manage your account information and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card & Activity */}
          <div className="space-y-8 lg:col-span-1">
               {/* Profile Picture Card */}
              <Card className="rounded-none border-border shadow-none">
                <CardHeader className="border-b border-border bg-muted/20">
                    <CardTitle className="font-heading uppercase text-lg">Identity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                    <div className="relative group">
                      <Avatar className="h-32 w-32 rounded-none border-2 border-primary">
                        <AvatarImage src={user?.photoURL || "/placeholder.svg?height=128&width=128"} className="object-cover"/>
                        <AvatarFallback className="text-4xl rounded-none font-heading bg-background text-primary">
                          {formData.firstName?.[0]}{formData.lastName?.[0] || formData.firstName?.[1]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-none border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        variant="default"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1 w-full">
                        <h3 className="text-xl font-heading font-bold uppercase truncate">{user?.displayName || "Admin User"}</h3>
                        <p className="text-xs font-mono text-muted-foreground truncate">{user?.email || "admin@cloudvpn.com"}</p>
                    </div>

                    <Badge variant="outline" className="rounded-none border-primary text-primary px-4 py-1 uppercase tracking-widest text-[10px] bg-primary/5">
                        <Shield className="h-3 w-3 mr-2" />
                        Administrator
                    </Badge>

                    <div className="grid grid-cols-2 gap-2 w-full pt-4">
                        <Button variant="outline" size="sm" className="rounded-none text-xs h-8 uppercase">
                        Change Photo
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none text-xs h-8 uppercase hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                        Remove
                        </Button>
                    </div>
                </CardContent>
              </Card>

              {/* Account Activity */}
              <Card className="rounded-none border-border shadow-none">
                <CardHeader className="border-b border-border bg-muted/20">
                  <CardTitle className="font-heading uppercase text-lg flex items-center gap-2">
                       <Shield className="w-4 h-4" />
                       Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {activityLogs.length === 0 ? (
                    <div className="text-muted-foreground text-xs text-center py-8 uppercase tracking-wider">No recent activity found.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {activityLogs.map((activity) => (
                        <div key={activity.id} className="flex flex-col gap-1 p-4 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="font-heading uppercase text-xs font-bold text-foreground">{activity.action}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : ""}
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                                {activity.details} • {activity.ip}
                            </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>

          {/* Right Column: Forms */}
          <div className="space-y-8 lg:col-span-2">
                {/* Personal Information */}
              <Card className="rounded-none border-border shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle className="font-heading uppercase text-xl">Personal Details</CardTitle>
                  <CardDescription className="uppercase text-xs tracking-wider">Update your basic account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs uppercase font-bold text-muted-foreground">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="pl-9 rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs uppercase font-bold text-muted-foreground">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="pl-9 rounded-none border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
                            <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" defaultValue={user?.email || ""} className="pl-9 rounded-none border-border bg-muted/20" disabled />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs uppercase font-bold text-muted-foreground">Phone Number</Label>
                            <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="pl-9 rounded-none border-border font-mono"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            </div>
                        </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs uppercase font-bold text-muted-foreground">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="San Francisco, CA"
                        className="pl-9 rounded-none border-border uppercase"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-xs uppercase font-bold text-muted-foreground">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="rounded-none border-border resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={handleProfileUpdate} disabled={isLoading} className="rounded-none bg-primary text-primary-foreground min-w-[150px]">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!isLoading && <Save className="mr-2 h-4 w-4" />}
                      SAVE CHANGES
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="rounded-none border-border shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle className="font-heading uppercase text-xl">Security & Authentication</CardTitle>
                  <CardDescription className="uppercase text-xs tracking-wider">Manage system access credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  {/* Change Password */}
                  <div className="space-y-6">
                    <h4 className="font-bold uppercase text-sm flex items-center gap-2 text-primary">
                      <Key className="h-4 w-4" />
                      Update Password
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-[10px] uppercase font-bold text-muted-foreground">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          className="rounded-none border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword"  className="text-[10px] uppercase font-bold text-muted-foreground">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          className="rounded-none border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword"  className="text-[10px] uppercase font-bold text-muted-foreground">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          className="rounded-none border-border"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                         <Button size="sm" onClick={handlePasswordUpdate} disabled={isLoading} variant="outline" className="rounded-none border-primary text-primary uppercase text-xs font-bold hover:bg-primary hover:text-primary-foreground">
                            {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border bg-muted/5">
                      <div>
                        <h4 className="font-bold uppercase text-sm flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Two-Factor Authentication
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">Enhance account security with 2FA.</p>
                      </div>
                      <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={(checked) => {
                          setTwoFactorEnabled(checked)
                          if (checked) setShow2FADialog(true)
                        }}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {twoFactorEnabled && (
                      <div className="border border-green-500/20 bg-green-500/5 p-4 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-green-500 text-green-600 uppercase text-[10px] bg-green-500/10">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                            </Badge>
                            <span className="text-xs font-bold uppercase text-green-700">Account Protected</span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Backup Codes</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {backupCodes.map((code, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-background border border-border font-mono text-xs">
                                <span className="flex-1 tracking-widest">{code}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-none hover:bg-muted" onClick={handleCopyBackupCode}>
                                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          </div>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md rounded-none border-border">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">Enable 2FA</DialogTitle>
            <DialogDescription className="uppercase text-xs tracking-wider">
              Scan with Authenticator App (Google/Authy)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex justify-center p-6 bg-white border-2 border-dashed border-border w-fit mx-auto">
              <div className="h-40 w-40 bg-zinc-900 flex items-center justify-center">
                 {/* Placeholder QR */}
                 <div className="grid grid-cols-4 gap-1 p-2 w-full h-full opacity-50">
                    {Array(16).fill(0).map((_, i) => (
                        <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                    ))}
                 </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Manual Entry Key</Label>
              <div className="flex gap-2">
                <Input readOnly value="JBSWY3DPEHPK3PXP" className="font-mono text-center rounded-none border-border bg-muted/20" />
                <Button size="icon" variant="outline" onClick={handleCopyBackupCode} className="rounded-none border-border">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Verification Code</Label>
              <Input placeholder="000 000" maxLength={6} className="text-center text-xl tracking-[0.5em] font-mono rounded-none border-border h-12" />
            </div>

            <Button className="w-full rounded-none font-bold uppercase tracking-wider" onClick={() => setShow2FADialog(false)}>
              Verify & Enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
