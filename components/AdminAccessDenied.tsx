"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { LogOut, ShieldX } from "lucide-react";

export function AdminAccessDenied() {
  const handleLogout = async () => {
    await authClient.signOut();
    // refresh the page to reflect logged out state
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-8">
          Your current account does not have administrator privileges.
          Please contact your system administrator if you believe this is an error.
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}