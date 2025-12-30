import "@/app/globals.css";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  // Check if user is logged in and has the admin role
  if (!session?.user || session.user.role !== "admin") {
    // redirect to admin login page
    return redirect("/admin/login");
  }

  return (
    <html lang="en">
      <head>
        <title>Admin Dashboard</title>
      </head>
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <AdminDashboardLayout>{children}</AdminDashboardLayout>
      </body>
    </html>
  );
}
