"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Auto-submit when OTP is complete
  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !loading) {
      handleVerifyOtp();
    }
  }, [otp, loading]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits

    const filteredValue = value.replace(/\D/g, ""); // Only allow digits
    const newOtp = [...otp];
    newOtp[index] = filteredValue;
    setOtp(newOtp);

    // Auto-focus next input only if we actually added a digit
    if (filteredValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
    if (paste.length === 6) {
      setOtp(paste.split(""));
      // Focus the last input
      const lastInput = document.getElementById("otp-5");
      lastInput?.focus();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) {
        setError(error.message || "Failed to send OTP");
        setLoading(false);
        return;
      }
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    setLoading(true);
    setError("");
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email,
        otp: otpString,
      });

      if (error) {
        // Handle authentication error from the response
        setOtp(["", "", "", "", "", ""]);
        setError(`${error.message || "Invalid OTP"}.`);
        setLoading(false);
        return;
      }

      // Only redirect on successful authentication
      router.replace("/");
    } catch (err: any) {
      setOtp(["", "", "", "", "", ""]);
      setError(`${err.message || "Invalid OTP"}.`);
      setLoading(false);
      return;
    }
    // Only reach here on success
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-8 w-full max-w-2xl mx-auto sm:w-[420px]">
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome</h2>
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Continue"}
            </Button>
          </form>
        )}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block mb-3 font-medium text-center">Enter 6-digit OTP</label>
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    required
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            {loading && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-2">
                  <LoadingIndicator size="md" colorClass="border-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Verifying...</p>
              </div>
            )}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
