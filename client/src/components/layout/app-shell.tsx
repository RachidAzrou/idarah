import Navbar from "./navbar";
import { CommandPalette } from "../command-palette";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="content-area">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}