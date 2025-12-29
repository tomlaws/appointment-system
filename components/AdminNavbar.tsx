"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut, Menu } from "lucide-react";

interface AdminNavbarProps {
  onMenuClick?: () => void;
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
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
    <nav className="bg-slate-800 text-white px-4 sm:px-6 py-4 flex items-center justify-between shadow">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-slate-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo/Title */}
        <span className="text-lg sm:text-xl font-bold tracking-wide">Appointment System</span>
      </div>

      {/* Logout Button */}
      <button
        type="button"
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