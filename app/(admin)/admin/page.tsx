"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const router = useRouter();
  // TODO: Add authentication/authorization logic here
  useEffect(() => {
    // Example: redirect if not admin
    // router.push("/login");
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">Admin Dashboard</h1>
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
        <p className="text-blue-900 mb-4">Welcome to the admin dashboard. Here you can manage bookings, users, and view system stats.</p>
        {/* Add admin features/components here */}
      </div>
    </div>
  );
}
