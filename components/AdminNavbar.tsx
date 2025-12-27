"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: redirect anyway
      router.push("/admin/login");
    }
  };

  return (
    <nav className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shadow">
      <span className="text-xl font-bold tracking-wide">Appointment System</span>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-700 transition-colors"
        title="Logout"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </nav>
  );
}