
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AlertCircle, CheckCircle2, ShieldAlert, Wifi, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DeleteAccountPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setStatus("error");
            setMessage("Please enter both email and password.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            // 1. Verify credentials client-side
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user) {
                throw new Error("Authentication failed.");
            }

            // 2. Get ID Token
            const idToken = await user.getIdToken();

            // 3. Request Deletion API
            const response = await fetch("/api/account/delete", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process deletion request.");
            }

            setStatus("success");
            setMessage("Your account has been successfully deleted.");
            setEmail("");
            setPassword("");
        } catch (error: any) {
            console.error("Deletion Error:", error);
            setStatus("error");

            if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
                setMessage("Invalid email or password.");
            } else if (error.code === "auth/too-many-requests") {
                setMessage("Too many attempts. Please try again later.");
            } else {
                setMessage(error.message || "An unexpected error occurred.");
            }
        }
    };

    const handleGoogleDelete = async () => {
        setStatus("loading");
        setMessage("");

        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            if (!user) {
                throw new Error("Authentication failed.");
            }

            const idToken = await user.getIdToken();

            const response = await fetch("/api/account/delete", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process deletion request.");
            }

            setStatus("success");
            setMessage("Your Google-linked account has been successfully deleted.");
        } catch (error: any) {
            console.error("Google Deletion Error:", error);
            setStatus("error");
            setMessage(error.message || "Failed to verify with Google.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-xl shadow-primary/20">
                        <Wifi className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
                        Velocity VPN
                    </h1>
                    <p className="text-muted-foreground">Secure. Private. Fast.</p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 text-destructive">
                        <ShieldAlert className="w-6 h-6" />
                        <h2 className="text-xl font-semibold">Delete Account</h2>
                    </div>

                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        This action is permanent. Your account will be deleted, and all associated data will be removed. You will lose access to any active subscriptions.
                    </p>

                    {status === "success" ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
                        >
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-green-500 mb-1">Account Deleted</h3>
                            <p className="text-sm text-green-500/80 mb-4">{message}</p>
                            <Link
                                href="/"
                                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleDelete} className="space-y-6">
                            {status === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{message}</p>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:ring-2 focus:ring-destructive/30 focus:border-destructive outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border focus:ring-2 focus:ring-destructive/30 focus:border-destructive outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background/80 backdrop-blur-xl px-2 text-muted-foreground">
                                        Or verify with
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleDelete}
                                disabled={status === "loading"}
                                className="w-full py-3 px-4 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full py-3.5 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-medium shadow-lg shadow-destructive/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {status === "loading" ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Confirm Deletion"
                                    )}
                                </button>
                                <p className="text-center mt-4">
                                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Cancel
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
