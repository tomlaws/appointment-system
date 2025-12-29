"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | undefined>(undefined);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  // Close sidebar when route changes on mobile (but not on initial mount)
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname && onClose) {
      onClose();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/30 z-10 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-56
        bg-white border-r border-blue-100
        py-8 px-4
        flex flex-col gap-2
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden self-end mb-4 p-2 rounded-md hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>

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
    </>
  );
}