import "@/app/globals.css";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/AdminAccessDenied";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  // If user has admin role, redirect to admin dashboard
  if (session?.user?.role === "admin") {
    return redirect("/admin");
  }

  // If user is logged in but not an admin, show access denied
  if (session?.user && session.user.role !== "admin") {
    return (
      <html lang="en">
        <head>
          <title>Access Denied - Appointment System</title>
        </head>
        <body className="antialiased bg-gray-50 min-h-screen font-sans">
          <AdminAccessDenied />
        </body>
      </html>
    );
  }

  // User is not logged in, show login form
  return (
    <html lang="en">
      <head>
        <title>Admin Login - Appointment System</title>
      </head>
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <div className="flex">
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
