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
  LogOut,
} from "lucide-react";
import { useAuth, avatarUrl } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">WS STORE</p>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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

        {/* User profile */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          {user ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors group">
              <img
                src={avatarUrl(user)}
                alt={user.username}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user.globalName ?? user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
                title="Sair"
                data-testid="btn-logout"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 h-auto w-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-2">Bot WS Store v1.0</p>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
