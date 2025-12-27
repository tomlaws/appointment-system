import "@/app/globals.css";
import { getServerSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

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
        <AdminNavbar />
        <div className="flex min-h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <AdminSidebar />
          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
