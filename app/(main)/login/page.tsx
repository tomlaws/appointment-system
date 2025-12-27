"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/email-otp/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "sign-in" }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sign-in/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) throw new Error("Invalid OTP or login failed");
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-8 w-full max-w-2xl mx-auto sm:w-[420px]">
        <h2 className="text-2xl font-bold mb-6 text-center">Login / Signup</h2>
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        )}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 tracking-widest text-center text-lg"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify & Login"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
