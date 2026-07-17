"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/shared/Button";

export default function DriverForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(identifier);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-black text-gray-900">DLM</h1>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Reset your password</p>
        </div>
        {submitted ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
            <p className="text-sm text-gray-700">If an account exists with that email, you will receive password reset instructions.</p>
            <Link href="/driver/login" className="text-sm text-primary hover:underline block">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
            <p className="text-xs text-center text-gray-500"><Link href="/driver/login" className="text-primary hover:underline">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
