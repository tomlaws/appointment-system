'use client';

import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';

export default function Navbar() {
    const { 
        data: session, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); 
  return (
    <nav className="w-full border-b border-blue-50 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-blue-700 font-bold">Appointment System</Link>
        </div>
        <div className="flex items-center gap-3">
          {!isPending && !session?.user && (
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          )}
          {!isPending && session?.user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                aria-label="User menu"
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm font-medium">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-blue-100 py-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/bookings"
                    className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <hr className="border-blue-100 my-1" />
                  <button
                    onClick={() => {
                      authClient.signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
