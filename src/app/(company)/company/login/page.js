"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/shared/Button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function parseError(message) {
  if (!message) return "Login failed. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("forbidden") || lower.includes("cannot access")) return "This account is not authorized for the company portal.";
  if (lower.includes("invalid") || lower.includes("unauthorized") || lower.includes("wrong password") || lower.includes("incorrect")) return "Invalid email or password.";
  if (lower.includes("deactivated") || lower.includes("suspended")) return "Your account has been deactivated. Contact support.";
  if (lower.includes("not found") || lower.includes("no user")) return "No account found with that email.";
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) return "Unable to connect. Please check your internet connection.";
  return message;
}

export default function CompanyLoginPage() {
  const { login, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/company/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, "/auth/company/login");
      router.push("/company/dashboard");
    } catch (err) {
      setError(parseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-black text-gray-900">DLM</h1>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Sign in to your company account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
          </div>
          <div className="relative">
            <label className="text-xs text-gray-500">Password</label>
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 pr-8" required />
            <button type="button" className="absolute right-2 top-[36px] text-gray-400" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
          <div className="flex items-center justify-between text-xs">
            <Link href="/company/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            <span className="text-gray-500">New here? <Link href="/company/register" className="text-primary hover:underline">Register</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
}
