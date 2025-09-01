import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { CommandPalette } from "../command-palette";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="content-area">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}