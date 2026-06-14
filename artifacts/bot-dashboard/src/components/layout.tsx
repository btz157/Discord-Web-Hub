import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Shield,
  Ticket,
  Gift,
  Tag,
  Zap,
  Megaphone,
  Settings,
  Bot,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/membros", label: "Membros", icon: Users },
  { path: "/moderacao", label: "Moderacao", icon: Shield },
  { path: "/tickets", label: "Tickets", icon: Ticket },
  { path: "/sorteios", label: "Sorteios", icon: Gift },
  { path: "/roles", label: "Cargos", icon: Tag },
  { path: "/gamificacao", label: "Gamificacao", icon: Zap },
  { path: "/anuncios", label: "Anuncios", icon: Megaphone },
  { path: "/config", label: "Config", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">WS STORE</p>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path || location.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Bot WS Store v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
