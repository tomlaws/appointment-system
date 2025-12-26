'use client';

import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export default function Navbar() {
    const { 
        data: session, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 
  return (
    <nav className="w-full border-b border-blue-50 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-blue-700 font-bold">Appointment System</div>
        </div>
        <div className="flex items-center gap-3">
          {!isPending && !session?.user && (
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          )}
          {!isPending && session?.user && (
            <div className="flex items-center gap-3">
              <span className="text-blue-700">{session.user.email}</span>
            </div>
          )}
            {!isPending && session?.user && (
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  authClient.signOut();
                }}
                className="text-blue-600 hover:underline"
              >
                Logout
              </Link>
            )}
        </div>
      </div>
    </nav>
  );
}
