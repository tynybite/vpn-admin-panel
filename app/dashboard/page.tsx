"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Users, Server, Activity, ArrowUpRight, ArrowDownRight, Globe, Shield, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { fetchWithAuth } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalServers: 0,
    activeServers: 0
  })
  const [activity, setActivity] = useState<any[]>([])
  const [trafficData, setTrafficData] = useState<any[]>([])
  
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/dashboard")
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setActivity(data.recentActivity || [])
        setTrafficData(data.trafficData || [])
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-border">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground font-sans mt-1">
            System status and real-time metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              System Operational
           </span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
             Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-none" />)
        ) : (
            <>
                <StatCard 
                  title="Total Users" 
                  value={stats.totalUsers.toLocaleString()} 
                  change={`+${stats.premiumUsers} Premium`} 
                  trend="neutral" 
                  icon={Users}
                />
                <StatCard 
                  title="Active Users" 
                  value={stats.activeUsers.toLocaleString()} 
                  change={`${Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}% Active`} 
                  trend="up" 
                  icon={Activity}
                />
                <StatCard 
                  title="Active Servers" 
                  value={`${stats.activeServers} / ${stats.totalServers}`}
                  change="Healthy" 
                  trend="up" 
                  icon={Server}
                />
                <StatCard 
                  title="Traffic (Est)" 
                  value="1.2 TB" 
                  change="+24%" 
                  trend="up" 
                  icon={Globe}
                />
            </>
        )}
      </div>

      {/* Charts & Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 rounded-none border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-heading uppercase text-xl">Traffic Analysis</CardTitle>
            <CardDescription className="uppercase text-xs tracking-wider">Daily bandwidth usage (GB).</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              {loading ? (
                  <Skeleton className="h-full w-full rounded-none" />
              ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                         cursor={{fill: 'var(--muted)'}}
                         contentStyle={{ 
                            backgroundColor: 'var(--popover)', 
                            borderColor: 'var(--border)',
                            borderRadius: '0px',
                            fontFamily: 'var(--font-sans)',
                            textTransform: 'uppercase',
                            fontSize: '12px',
                            fontWeight: 'bold'
                         }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="var(--primary)" 
                        radius={[0, 0, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 rounded-none border-border shadow-none">
          <CardHeader>
            <CardTitle className="font-heading uppercase text-xl">Live Feed</CardTitle>
            <CardDescription className="uppercase text-xs tracking-wider">Recent system events and user actions.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                {loading ? (
                     Array(5).fill(0).map((_, i) => (
                         <div key={i} className="flex gap-4">
                             <Skeleton className="h-10 w-10 rounded-full" />
                             <div className="space-y-2 flex-1">
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-4 w-1/2" />
                             </div>
                         </div>
                     ))
                ) : activity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground uppercase text-xs">
                        No recent activity
                    </div>
                ) : (
                    activity.map((item, i) => (
                       <div key={i} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="space-y-1">
                             <p className="text-sm font-medium leading-none font-heading uppercase">{item.action}</p>
                             <p className="text-xs text-muted-foreground font-mono">{item.user}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                 {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                             <div className={cn(
                                "mt-1 w-2 h-2 ml-auto rounded-none",
                                item.status === 'success' ? 'bg-primary' : 'bg-destructive'
                             )} />
                          </div>
                       </div>
                    ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <div className="p-6 border border-border bg-card">
            <h3 className="font-heading uppercase text-lg mb-4 flex items-center gap-2">
               <Shield className="w-5 h-5 text-primary" />
               Security Status
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm uppercase tracking-wide">
                  <span>Firewall</span>
                  <span className="font-bold text-primary">ACTIVE</span>
               </div>
               <div className="flex justify-between items-center text-sm uppercase tracking-wide">
                  <span>Threat Detection</span>
                  <span className="font-bold text-primary">ARMED</span>
               </div>
               <div className="flex justify-between items-center text-sm uppercase tracking-wide">
                  <span>Last Scan</span>
                  <span className="text-muted-foreground">AUTO</span>
               </div>
            </div>
         </div>

         <div className="p-6 border border-border bg-card">
            <h3 className="font-heading uppercase text-lg mb-4 flex items-center gap-2">
               <Zap className="w-5 h-5 text-primary" />
               Performance
            </h3>
            <div className="space-y-4">
               <div className="space-y-1">
                  <div className="flex justify-between text-xs uppercase font-bold">
                     <span>CPU Usage</span>
                     <span>24%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary">
                     <div className="h-full bg-primary w-[24%]" />
                  </div>
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between text-xs uppercase font-bold">
                     <span>Memory</span>
                     <span>56%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary">
                     <div className="h-full bg-primary w-[56%]" />
                  </div>
               </div>
            </div>
         </div>
         
         <div className="p-6 border border-border bg-card flex flex-col justify-center items-center text-center bg-accent/5">
             <div className="mb-2 p-3 bg-primary text-primary-foreground">
                <Globe className="w-6 h-6" />
             </div>
             <div className="text-3xl font-heading font-bold">{loading ? "-" : stats.activeServers}</div>
             <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Active Regions</div>
         </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, trend, icon: Icon }: any) {
   return (
      <Card className="rounded-none border-border shadow-none hover:border-primary transition-colors cursor-default group bg-card">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground">
               {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
         </CardHeader>
         <CardContent>
            <div className="text-2xl font-bold font-heading">{value}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 uppercase tracking-wider">
               {trend !== 'neutral' && (trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3 text-primary" />
               ) : (
                  <ArrowDownRight className="w-3 h-3 text-destructive" />
               ))}
               <span className={cn(
                   trend === 'up' && 'text-primary',
                   trend === 'down' && 'text-destructive'
               )}>
                  {change}
               </span>
            </p>
         </CardContent>
      </Card>
   )
}
