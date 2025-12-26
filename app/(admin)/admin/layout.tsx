import "@/app/globals.css";
import { auth, getServerSession } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
   const session = await getServerSession();

  // Check if user is logged in and has the admin role
  if (!session?.user || session.user.role !== "admin") {
    return notFound();
  }
  return (
    <html lang="en">
      <head>
        <title>Admin Dashboard - Appointment System</title>
      </head>
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        {/* Top Navbar */}
        <nav className="bg-blue-900 text-white px-6 py-4 flex items-center shadow">
          <span className="text-xl font-bold tracking-wide">Appointment System</span>
        </nav>
        <div className="flex min-h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <aside className="w-56 bg-white border-r border-blue-100 py-8 px-4 flex flex-col gap-2">
            <a href="/admin/users" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-50 transition">Users</a>
            <a href="/admin/bookings" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-50 transition">Bookings</a>
            <a href="/admin/timeslots" className="block px-4 py-2 rounded-lg text-blue-900 font-medium hover:bg-blue-50 transition">Time Slots</a>
          </aside>
          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
