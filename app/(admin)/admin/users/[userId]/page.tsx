"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { UserWithRole } from "better-auth/plugins";

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [nameChange, setNameChange] = useState("");
  const [roleChange, setRoleChange] = useState<"user" | "admin">("user");
  const [isRoot, setIsRoot] = useState(false);
  const [error, setError] = useState("");

  const formData = useMemo(() => {
    if (!user) {
      return {
        name: "",
        role: "user" as "user" | "admin",
      };
    }
    return {
      name: user.name || "",
      role: (user.role === "admin" ? "admin" : "user") as "user" | "admin",
    };
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // Get user details - we might need to fetch from listUsers or create a specific API
        // For now, let's assume we can get user by ID, but better-auth might not have direct getUser
        // We'll use listUsers with a filter or create an API endpoint
        const { data, error } = await authClient.admin.getUser({
          query: {
            id: userId,
          }
        })
        if (error) {
          setError("Failed to load user");
          return;
        }
        const user = data as UserWithRole | null;
        if (user) {
          setUser(user);
          setNameChange(user.name || "");
          setRoleChange((user.role === "admin" ? "admin" : "user"));
          setIsRoot(user.name === "Root");
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Prevent setting name to "Root" (except for the Root user themselves)
    if (nameChange.trim() === "Root" && !isRoot) {
      setError("The name 'Root' is reserved and cannot be used.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Update user name
      if (nameChange !== (user.name || "")) {
        const { error: updateError } = await authClient.admin.updateUser({
          userId: user.id,
          data: { name: nameChange },
        });
        if (updateError) {
          setError(updateError.message ?? "Failed to update user");
          return;
        }
      }

      // Update user role
      if (roleChange !== (user.role === "admin" ? "admin" : "user")) {
        const { error: roleError } = await authClient.admin.setRole({
          userId: user.id,
          role: roleChange,
        });
        if (roleError) {
          setError(roleError.message ?? "Failed to update user role");
          return;
        }
      }

      // Update user password if provided
      if (password.trim()) {
        const { error: passwordError, data } = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: password,
        });
        console.log(data)
        if (passwordError) {
          setError(passwordError.message ?? "Failed to update user password");
          return;
        }
      }

      // Success - redirect back to users list
      router.back();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    setError("");

    try {
      const { error } = await authClient.admin.removeUser({
        userId: user.id,
      });

      if (error) {
        setError(error.message ?? "Failed to delete user");
        return;
      }

      // Success - redirect back to users list
      router.back();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingIndicator />
        <span className="ml-2 text-blue-900">Loading user...</span>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-md transition-colors border border-slate-300 cursor-pointer mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-blue-900 mb-4">User not found</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-md transition-colors border border-slate-300 cursor-pointer mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-md transition-colors border border-slate-300 cursor-pointer mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-blue-900">Edit User</h1>
        <p className="text-blue-700 mt-2">{user.email}</p>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className={`block text-sm font-medium mb-2 ${
              isRoot ? "text-gray-500" : "text-blue-900"
            }`}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={nameChange}
              onChange={(e) => setNameChange(e.target.value)}
              className={`w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                isRoot ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              required
              disabled={isRoot}
            />
          </div>

          <div>
            <label htmlFor="role" className={`block text-sm font-medium mb-2 ${
              isRoot ? "text-gray-500" : "text-blue-900"
            }`}>
              Role
            </label>
            <select
              id="role"
              value={roleChange}
              onChange={(e) => setRoleChange(e.target.value as "user" | "admin")}
              className={`w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                isRoot ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              disabled={isRoot}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Leave empty to keep current password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1 hover:bg-gray-200 hover:border-gray-300 transition-colors"
              disabled={saving || deleting}
            >
              Cancel
            </Button>
            {!isRoot && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 hover:bg-red-700 hover:shadow-md transition-all"
                disabled={saving || deleting}
              >
                {deleting && <LoadingIndicator size="sm" className="mr-2" />}
                Delete User
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || deleting}
            >
              {saving && <LoadingIndicator size="sm" className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${user.name}? This action cannot be undone and will permanently remove the user account.`}
        confirmText="Yes, Delete User"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
