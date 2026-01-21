import { auth } from "./firebase"
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from "firebase/auth"

export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  bio?: string
  location?: string
  role?: "admin" | "user"
  accessToken?: string // Backend JWT
}

export interface ActivityLog {
  id: string
  action: string
  details: string
  ip: string
  timestamp: Date
}

class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  private constructor() {
    if (typeof window !== "undefined") {
      // Initialize with stored state
      const storedUser = localStorage.getItem("auth_user")
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser)
      }

      // Listen for real auth changes
      onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        if (user) {
          // Sync with backend to get latest RBAC data and accessToken
          try {
             const token = await user.getIdToken()
             const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebaseIdToken: token })
             })

             if (response.ok) {
                const data = await response.json()
                const userData = data.user
                
                const appUser: User = {
                  uid: user.uid,
                  email: user.email || "",
                  displayName: userData.displayName || user.displayName || "User",
                  photoURL: userData.photoURL || user.photoURL || "/placeholder.svg?height=40&width=40",
                  role: userData.role || "user",
                  bio: userData.bio || "",
                  location: userData.location || "",
                  phoneNumber: userData.phone || "", // Note: API returns 'phone' mapping to 'phoneNumber'
                  accessToken: data.accessToken
                }

                this.currentUser = appUser
                localStorage.setItem("auth_user", JSON.stringify(appUser))
             }
          } catch (e) {
             console.error("Failed to sync user with backend", e)
          }
        } else {
          this.currentUser = null
          localStorage.removeItem("auth_user")
        }
      })
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return this.handleUserLogin(userCredential.user)
    } catch (error: any) {
      if (error.code !== 'auth/wrong-password' && error.code !== 'auth/user-not-found' && error.code !== 'auth/invalid-credential') {
        console.error("Sign in failed", error)
      }
      throw error
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: "select_account"
      })

      const userCredential = await signInWithPopup(auth, provider)
      return this.handleUserLogin(userCredential.user)
    } catch (error) {
      console.error("Google sign in failed", error)
      throw error
    }
  }

  private async handleUserLogin(user: FirebaseUser): Promise<User> {
    // Exchange Firebase Token for Backend Session
    const token = await user.getIdToken()
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseIdToken: token })
    })
    
    if (!response.ok) {
        throw new Error("Failed to login to backend")
    }

    const data = await response.json()
    const userData = data.user

    const appUser: User = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL || "/placeholder.svg?height=40&width=40",
      role: userData.role || "user",
      bio: userData.bio || "",
      location: userData.location || "",
      phoneNumber: userData.phone || "",
      accessToken: data.accessToken
    }

    this.currentUser = appUser
    localStorage.setItem("auth_user", JSON.stringify(appUser))

    // Log login activity (optional, could be done by backend in /login route)
    // await this.logActivity(...) 

    return appUser
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth)
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
    }
  }

  async updateUseProfile(uid: string, data: Partial<User>): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error("No authenticated user")
    
    // 1. Update Firebase Auth Profile (DisplayName/Photo)
    if (data.displayName || data.photoURL) {
      await firebaseUpdateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL
      })
    }

    // 2. Update Backend Data
    const token = await user.getIdToken()
    await fetch("/api/app/profile", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.currentUser?.accessToken || token}` // Use backend token if available or fallback
         },
        body: JSON.stringify({
            bio: data.bio,
            location: data.location,
            phone: data.phoneNumber,
            displayName: data.displayName,
            photoURL: data.photoURL
        })
    })

    // 3. Update local state
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...data }
      localStorage.setItem("auth_user", JSON.stringify(this.currentUser))
    }
  }

  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser
    if (!user || !user.email) throw new Error("No authenticated user")

    // Re-authenticate first
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)

    await firebaseUpdatePassword(user, newPassword)
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Failed to send password reset email", error)
      throw error
    }
  }

  async getRecentActivity(uid: string): Promise<ActivityLog[]> {
     // TODO: Implement /api/app/activity endpoint if user activity history is needed
     // For now returning empty array as we migrated away from direct Firestore access
     return []
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }
}

export const authService = AuthService.getInstance()
