// "use client";
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { authClient } from "../lib/auth-client";

// interface User {
//   id: string;
//   email: string;
//   [key: string]: any;
// }

// interface UserContextType {
//   user: User | null;
//   loading: boolean;
// }

// const UserContext = createContext<UserContextType>({ user: null, loading: true });

// export function UserProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let unsub: (() => void) | undefined;
//     setLoading(true);
//     unsub = authClient.onAuthStateChange((session) => {
//       setUser(session?.user || null);
//       setLoading(false);
//     });
//     // Initial check
//     const session = authClient.getSession();
//     setUser(session?.user || null);
//     setLoading(false);
//     return () => { if (unsub) unsub(); };
//   }, []);

//   return (
//     <UserContext.Provider value={{ user, loading }}>
//       {children}
//     </UserContext.Provider>
//   );
// }

// export function useUser() {
//   return useContext(UserContext);
// }
