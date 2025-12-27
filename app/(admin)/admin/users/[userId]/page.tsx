"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [formData, setFormData] = useState({
    name: "",
    role: "user" as "user" | "admin",
  });
  const [error, setError] = useState("");

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
          setFormData({
            name: user.name || "",
            role: (user.role === "admin" ? "admin" : "user"),
          });
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

    setSaving(true);
    setError("");

    try {
      // Update user name
      if (formData.name !== user.name) {
        const { error: updateError } = await authClient.admin.updateUser({
          userId: user.id,
          data: { name: formData.name },
        });
        if (updateError) {
          setError(updateError.message ?? "Failed to update user");
          return;
        }
      }

      // Update user role
      if (formData.role !== user.role) {
        const { error: roleError } = await authClient.admin.setRole({
          userId: user.id,
          role: formData.role,
        });
        if (roleError) {
          setError(roleError.message ?? "Failed to update user role");
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
        <Button onClick={() => router.push("/admin/users")}>Back</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-blue-900 mb-4">User not found</p>
        <Button onClick={() => router.push("/admin/users")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => router.push("/admin/users")}
          className="mb-4"
        >
          ← Back to Users
        </Button>
        <h1 className="text-3xl font-bold text-blue-900">Edit User</h1>
        <p className="text-blue-700 mt-2">{user.email}</p>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-blue-900 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-blue-900 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as "user" | "admin" }))}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
              disabled={saving || deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="flex-1"
              disabled={saving || deleting}
            >
              {deleting && <LoadingIndicator size="sm" className="mr-2" />}
              Delete User
            </Button>
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
