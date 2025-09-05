import Sidebar from "./sidebar";
import { CommandPalette } from "../command-palette";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}