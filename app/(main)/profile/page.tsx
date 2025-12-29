"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { User, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const { data: session, isPending, refetch } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session, isPending, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await authClient.updateUser({
        name: name.trim(),
      });

      setSuccess("Profile updated successfully!");
      // Refetch session to get updated data
      refetch();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Appointments
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                value={email}
                disabled
                title="Email cannot be changed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email address cannot be modified
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </Button>

              <Link href="/">
                <Button variant="secondary" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span className="text-gray-900">
                {session.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">
                {session.user.updatedAt
                  ? new Date(session.user.updatedAt).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}