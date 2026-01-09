"use client"

import { useState, useEffect } from "react"
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    Sparkles,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/api-client"
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
import { AdminAlert } from "@/components/admin-alert"

interface Plan {
    id: string
    name: string
    price: number
    currency: string
    interval: "month" | "year" | "week"
    googleProductId: string
    features: string[]
    isActive: boolean
    popular: boolean
}

export default function SubscriptionsConfigPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === "admin"


    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
        name: "",
        price: 0,
        currency: "USD",
        interval: "month",
        googleProductId: "",
        features: [],
        isActive: true,
        popular: false
    })
    const [featuresInput, setFeaturesInput] = useState("")

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth("/api/admin/subscriptions")
            const data = await res.json()
            if (data.plans) {
                setPlans(data.plans)
            }
        } catch (error) {
            console.error("Failed to fetch plans:", error)
            toast.error("Error", {
                description: "Failed to load subscription plans.",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (plan?: Plan) => {
        if (plan) {
            setCurrentPlan(plan)
            setFeaturesInput(plan.features?.join("\n") || "")
        } else {
            setCurrentPlan({
                name: "",
                price: 9.99,
                currency: "USD",
                interval: "month",
                googleProductId: "",
                features: [],
                isActive: true,
                popular: false
            })
            setFeaturesInput("- Ad-free experience\n- Fast connection\n- Premium locations")
        }
        setIsDialogOpen(true)
    }

    const handleSavePlan = async () => {
        try {
            if (!currentPlan.name || !currentPlan.googleProductId) {
                toast.error("Validation Error", {
                    description: "Name and Google Product ID are required."
                })
                return
            }

            const featuresList = featuresInput
                .split("\n")
                .map(f => f.trim())
                .filter(f => f.length > 0)

            const payload = {
                ...currentPlan,
                features: featuresList,
                price: Number(currentPlan.price) // Ensure number
            }

            const method = currentPlan.id ? "PUT" : "POST"
            const res = await fetchWithAuth("/api/admin/subscriptions", {
                method,
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to save plan")

            toast.success("Success", {
                description: `Plan ${currentPlan.id ? "updated" : "created"} successfully.`
            })

            setIsDialogOpen(false)
            fetchPlans()
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Error", {
                description: "Failed to save plan settings."
            })
        }
    }

    const handleDeletePlan = async () => {
        if (!currentPlan.id) return

        try {
            const res = await fetchWithAuth(`/api/admin/subscriptions?id=${currentPlan.id}`, {
                method: "DELETE"
            })

            if (!res.ok) throw new Error("Failed to delete plan")

            toast.success("Success", {
                description: "Plan deleted successfully."
            })

            setIsDeleteDialogOpen(false)
            fetchPlans()
        } catch (error) {
            console.error("Delete error:", error)
            toast.error("Error", {
                description: "Failed to delete plan."
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
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Subscriptions</h1>
                    <p className="text-muted-foreground font-sans text-sm mt-1">Manage pricing tiers and features.</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => handleOpenDialog()} className="rounded-none shadow-none bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        NEW PLAN
                    </Button>
                )}
            </div>

            {!isAdmin && <AdminAlert message="You need permission to modify subscription plans." />}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative group flex flex-col rounded-none border p-8 transition-all duration-300 hover:border-primary border-border bg-card",
                            plan.popular
                                ? "border-primary shadow-sm"
                                : "shadow-none",
                            !plan.isActive && "opacity-60 grayscale border-dashed"
                        )}
                    >
                        {/* Popular Badge */}
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2">
                                <span className="inline-flex items-center gap-1 rounded-none bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground ring-4 ring-background">
                                    <Sparkles className="h-3 w-3" />
                                    Best Value
                                </span>
                            </div>
                        )}

                        {/* Status Badge */}
                        {!plan.isActive && (
                            <div className="absolute top-4 right-4">
                                <Badge variant="secondary" className="rounded-none px-2.5 text-[10px] uppercase">Inactive</Badge>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-lg font-heading font-bold uppercase text-foreground mb-2 flex items-center gap-2">
                                {plan.name}
                                {plan.interval === "year" && <Badge variant="outline" className="rounded-none text-[10px] h-5 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-600">SAVE 20%</Badge>}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-heading font-bold tracking-tight">{plan.currency === "USD" ? "$" : plan.currency} {plan.price}</span>
                                <span className="text-muted-foreground font-medium uppercase text-xs">/{plan.interval}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">{plan.googleProductId}</p>
                        </div>

                        <div className="space-y-4 flex-1 mb-8">
                            <div className="h-px bg-border" />
                            <ul className="space-y-3">
                                {plan.features?.slice(0, 5).map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                        <span className="text-muted-foreground leading-tight">{feature}</span>
                                    </li>
                                ))}
                                {plan.features && plan.features.length > 5 && (
                                    <li className="text-xs text-muted-foreground pl-8 pt-1 uppercase">
                                        +{plan.features.length - 5} more benefits
                                    </li>
                                )}
                            </ul>
                        </div>

                        {isAdmin && (
                            <div className="mt-auto pt-4 flex gap-3 border-t border-border/50">
                                <Button
                                    onClick={() => handleOpenDialog(plan)}
                                    className={cn(
                                        "flex-1 rounded-none h-10 font-bold uppercase text-xs tracking-wider shadow-none",
                                        plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-secondary-foreground hover:bg-muted/80"
                                    )}
                                >
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Edit Plan
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-none h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        setCurrentPlan(plan)
                                        setIsDeleteDialogOpen(true)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg rounded-none border-border">
                    <DialogHeader>
                        <DialogTitle className="font-heading uppercase">{currentPlan.id ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                        <DialogDescription className="uppercase text-xs tracking-wider">
                            Configure subscription tiers. Sync Product ID with Play Console.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Plan Name</Label>
                                <Input
                                    placeholder="E.G. MONTHLY PREMIUM"
                                    value={currentPlan.name}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                                    className="rounded-none uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Google Product ID</Label>
                                <Input
                                    placeholder="vpn_premium_monthly"
                                    value={currentPlan.googleProductId}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, googleProductId: e.target.value })}
                                    className="rounded-none font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Price</Label>
                                <Input
                                    type="number"
                                    placeholder="9.99"
                                    value={currentPlan.price}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                                    className="rounded-none font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Currency</Label>
                                <Input
                                    placeholder="USD"
                                    value={currentPlan.currency}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, currency: e.target.value })}
                                    className="rounded-none uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Interval</Label>
                                <Select
                                    value={currentPlan.interval}
                                    onValueChange={(val: any) => setCurrentPlan({ ...currentPlan, interval: val })}
                                >
                                    <SelectTrigger className="rounded-none border-border uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-border">
                                        <SelectItem value="week" className="uppercase">Weekly</SelectItem>
                                        <SelectItem value="month" className="uppercase">Monthly</SelectItem>
                                        <SelectItem value="year" className="uppercase">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Features (One per line)</Label>
                            <Textarea
                                rows={5}
                                placeholder="- High speed servers..."
                                value={featuresInput}
                                onChange={(e) => setFeaturesInput(e.target.value)}
                                className="rounded-none border-border"
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2 border border-border p-3 bg-muted/10">
                            <div className="flex flex-col space-y-1">
                                <Label className="text-xs uppercase font-bold">Active Status</Label>
                                <span className="text-[10px] text-muted-foreground uppercase">Visible in app</span>
                            </div>
                            <Switch
                                checked={currentPlan.isActive}
                                onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, isActive: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2 border border-border p-3 bg-muted/10">
                            <div className="flex flex-col space-y-1">
                                <Label className="text-xs uppercase font-bold">Popular Badge</Label>
                                <span className="text-[10px] text-muted-foreground uppercase">Highlight as "Best Value"</span>
                            </div>
                            <Switch
                                checked={currentPlan.popular}
                                onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, popular: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none">CANCEL</Button>
                        <Button onClick={handleSavePlan} className="rounded-none">SAVE CHANGES</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-none border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading uppercase">CONFIRM DELETION</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Permanently delete <strong>{currentPlan.name}</strong>?
                            <br/>
                            <span className="text-xs uppercase font-bold text-destructive mt-2 block">Action cannot be undone. Remove from Google Play Console manually.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">CANCEL</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none" onClick={handleDeletePlan}>
                            DELETE PLAN
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
