export function VCenter({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-h-0 flex items-center justify-center">
      {children}
    </main>
  );
}