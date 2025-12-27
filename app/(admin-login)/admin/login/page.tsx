"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message ?? "An unknown error occurred.");
      } else if (data?.user) {
        // Check if user is admin
        const { data: session } = await authClient.getSession();
        if (session?.user.role === "admin") {
          router.push("/admin");
        } else {
          setError("Access denied. Admin privileges required.");
        }
      }
    } catch (err) {
      setError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border border-blue-100 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-900">Admin Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <LoadingIndicator size="sm" className="mr-2" />}
          Login
        </Button>
      </form>
    </div>
  );
}
