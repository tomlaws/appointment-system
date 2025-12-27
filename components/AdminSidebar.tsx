"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-56 bg-white border-r border-blue-100 py-8 px-4 flex flex-col gap-2">
      <Link
        href="/admin/users"
        className={`block px-4 py-2 rounded-lg font-medium transition ${
          isActive("/admin/users")
            ? "bg-blue-100 text-blue-900"
            : "text-blue-900 hover:bg-blue-50"
        }`}
      >
        Users
      </Link>
      <Link
        href="/admin/bookings"
        className={`block px-4 py-2 rounded-lg font-medium transition ${
          isActive("/admin/bookings")
            ? "bg-blue-100 text-blue-900"
            : "text-blue-900 hover:bg-blue-50"
        }`}
      >
        Bookings
      </Link>
      <Link
        href="/admin/time-slots"
        className={`block px-4 py-2 rounded-lg font-medium transition ${
          isActive("/admin/time-slots")
            ? "bg-blue-100 text-blue-900"
            : "text-blue-900 hover:bg-blue-50"
        }`}
      >
        Time Slots
      </Link>
    </aside>
  );
}