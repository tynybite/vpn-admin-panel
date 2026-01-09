"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/api-client"
import { isEqual } from "lodash"

export interface AdProfile {
    id: string
    name: string
    provider: "admob" | "facebook" | "none"
    admob: {
        appId: string
        bannerId: string
        interstitialId: string
        nativeId: string
        openAppId: string
        rewardedId: string
    }
    facebook: {
        appId: string
        bannerId: string
        interstitialId: string
        nativeId: string
        rewardedId: string
    }
}

export interface AdsConfig {
    activeProfileId: string
    profiles: AdProfile[]
    settings: {
        adFrequency: number
        bannerPosition: string
        rewardedVideoReward: string
    }
}

export interface ConfigState {
    features: {
        killswitch: boolean
        splitTunnel: boolean
        autoReconnect: boolean
        subscriptions: boolean
        experimental: boolean
    }
    vpn: {
        connectionTimeout: number
        reconnectAttempts: number
        reconnectDelay: number
        protocol: string
        customDns: string
    }
    ui: {
        primaryColor: string
        accentColor: string
        appName: string
        logoUrl: string
        showcaseText: string
    }
    ads: AdsConfig
    version: {
        currentVersion: string
        minVersion: string
        cacheVersion: number
        maintenanceMode: boolean
        updateMessage: string
    }
}

const defaultAdProfile: AdProfile = {
    id: "default",
    name: "Default Profile",
    provider: "admob",
    admob: {
        appId: "",
        bannerId: "",
        interstitialId: "",
        nativeId: "",
        openAppId: "",
        rewardedId: "",
    },
    facebook: {
        appId: "",
        bannerId: "",
        interstitialId: "",
        nativeId: "",
        rewardedId: "",
    }
}

const defaultConfig: ConfigState = {
    features: {
        killswitch: true,
        splitTunnel: true,
        autoReconnect: true,
        subscriptions: true,
        experimental: false,
    },
    vpn: {
        connectionTimeout: 30,
        reconnectAttempts: 3,
        reconnectDelay: 5,
        protocol: "auto",
        customDns: "8.8.8.8, 8.8.4.4",
    },
    ui: {
        primaryColor: "#3b82f6",
        accentColor: "#06b6d4",
        appName: "Velocity VPN ",
        logoUrl: "https://example.com/logo.png",
        showcaseText: "Fast and secure VPN connections worldwide. Protect your privacy with military-grade encryption.",
    },
    ads: {
        activeProfileId: "default",
        profiles: [defaultAdProfile],
        settings: {
            adFrequency: 3,
            bannerPosition: "bottom",
            rewardedVideoReward: "24 hours ad-free experience",
        }
    },
    version: {
        currentVersion: "2.5.0",
        minVersion: "2.0.0",
        cacheVersion: 1,
        maintenanceMode: false,
        updateMessage: "Please update to the latest version for the best experience.",
    },
}

export interface ConfigChange {
    path: string
    oldValue: any
    newValue: any
    section: string
}

export function useConfig() {

    const [config, setConfig] = useState<ConfigState>(defaultConfig)
    const [originalConfig, setOriginalConfig] = useState<ConfigState>(defaultConfig)
    const [loading, setLoading] = useState(true)
    const [hasChanges, setHasChanges] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth("/api/admin/config")
            if (res.ok) {
                const data = await res.json()
                if (data && Object.keys(data).length > 0) {
                    const newConfig = {
                        ...defaultConfig,
                        ...data,
                        features: { ...defaultConfig.features, ...data.features },
                        vpn: { ...defaultConfig.vpn, ...data.vpn },
                        ui: { ...defaultConfig.ui, ...data.ui },
                        ads: { ...defaultConfig.ads, ...data.ads },
                        version: { ...defaultConfig.version, ...data.version },
                    }
                    setConfig(newConfig)
                    setOriginalConfig(JSON.parse(JSON.stringify(newConfig))) // Deep copy
                    setHasChanges(false)
                }
            }
        } catch (error) {
            console.error("Error fetching config:", error)
            toast.error("Error", { description: "Failed to load configuration" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    const updateConfig = (section: keyof ConfigState, key: string, value: any) => {
        setConfig((prev) => {
            const newConfig = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value,
                },
            }
            return newConfig
        })
    }

    // Check for changes whenever config updates
    useEffect(() => {
        if (!loading) {
            const isDifferent = JSON.stringify(config) !== JSON.stringify(originalConfig)
            setHasChanges(isDifferent)
        }
    }, [config, originalConfig, loading])


    const saveConfig = async () => {
        try {
            setSaving(true)
            const res = await fetchWithAuth("/api/admin/config", {
                method: "POST",
                body: JSON.stringify(config),
            })

            if (!res.ok) throw new Error("Failed to save")

            setOriginalConfig(JSON.parse(JSON.stringify(config)))
            setHasChanges(false)
            toast.success("Success", { description: "Configuration published successfully" })
            return true
        } catch (error) {
            console.error("Error saving config:", error)
            toast.error("Error", { description: "Failed to save configuration" })
            return false
        } finally {
            setSaving(false)
        }
    }

    const getChanges = (): ConfigChange[] => {
        const changes: ConfigChange[] = []

        // Helper to compare objects
        const compareObjects = (obj1: any, obj2: any, pathPrefix: string, section: string) => {
            if (!obj1 && !obj2) return
            // If one is missing while other exists, that's a change
            if ((!obj1 && obj2) || (obj1 && !obj2)) {
                changes.push({
                    path: pathPrefix,
                    oldValue: obj2 === undefined ? "undefined" : obj2,
                    newValue: obj1 === undefined ? "undefined" : obj1,
                    section
                })
                return
            }

            // If primitive types don't match
            if (typeof obj1 !== typeof obj2) {
                changes.push({
                    path: pathPrefix,
                    oldValue: obj2,
                    newValue: obj1,
                    section
                })
                return
            }

            // Handle Arrays
            if (Array.isArray(obj1)) {
                if (!Array.isArray(obj2)) {
                    changes.push({
                        path: pathPrefix,
                        oldValue: obj2,
                        newValue: obj1,
                        section
                    })
                    return
                }

                // Check if this is an array of objects with IDs (like profiles)
                const hasIds = obj1.length > 0 && typeof obj1[0] === 'object' && 'id' in obj1[0]

                if (hasIds) {
                    // ID-based comparison for lists like profiles
                    const map2 = new Map(obj2.map((item: any) => [item.id, item]))

                    obj1.forEach((item1: any, index: number) => {
                        const item2 = map2.get(item1.id)
                        // Use name if available for more meaningful path, otherwise index
                        const pathKey = item1.name ? `["${item1.name}"]` : `[${index}]`
                        const currentPath = `${pathPrefix}${pathKey}`

                        if (item2) {
                            // Item exists in both, compare recursively
                            compareObjects(item1, item2, currentPath, section)
                            map2.delete(item1.id) // Remove processed item
                        } else {
                            // New item added (using simplified display for whole object)
                            changes.push({
                                path: currentPath,
                                oldValue: "Non-existent",
                                newValue: "Added", // Simplified for UI, could recurse if needed
                                section
                            })
                        }
                    })

                    // Remaining items in map2 were deleted
                    map2.forEach((item2: any) => {
                        // Find the approximate index or just append
                        changes.push({
                            path: `${pathPrefix} (Deleted ${item2.name || item2.id})`,
                            oldValue: "Existing",
                            newValue: "Deleted",
                            section
                        })
                    })
                } else {
                    // Standard array comparison (by index)
                    // If lengths differ wildly, simpler to say "modified", but let's try deep compare
                    if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
                        // Check if simple list of primitives
                        if (obj1.length > 0 && typeof obj1[0] !== 'object') {
                            changes.push({
                                path: pathPrefix,
                                oldValue: String(obj2),
                                newValue: String(obj1),
                                section
                            })
                        } else {
                            // Complex array without IDs, fallback to basic recursive step by index
                            const maxLen = Math.max(obj1.length, obj2.length)
                            for (let i = 0; i < maxLen; i++) {
                                compareObjects(obj1[i], obj2[i], `${pathPrefix}[${i}]`, section)
                            }
                        }
                    }
                }
                return
            }

            // Handle Objects
            if (typeof obj1 === 'object' && obj1 !== null) {
                // Get all unique keys
                const allKeys = Array.from(new Set([...Object.keys(obj1), ...Object.keys(obj2)]))

                allKeys.forEach(key => {
                    const val1 = obj1[key]
                    const val2 = obj2[key]
                    const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key

                    // Skip internal fields like ID if they match (we cared about ID for finding the object, now checking content)
                    if (key === 'id' && val1 === val2) return;

                    compareObjects(val1, val2, currentPath, section)
                })
                return
            }

            // Handle Primitives
            if (obj1 !== obj2) {
                changes.push({
                    path: pathPrefix,
                    oldValue: obj2,
                    newValue: obj1,
                    section
                })
            }
        }

        // Compare top-level sections
        (Object.keys(config) as Array<keyof ConfigState>).forEach(section => {
            compareObjects(config[section], originalConfig[section], section, section)
        })

        return changes
    }

    return { config, loading, hasChanges, updateConfig, saveConfig, saving, getChanges }
}
