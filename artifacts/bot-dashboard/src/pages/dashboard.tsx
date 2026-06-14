import { Users, Ticket, Shield, Zap, Gift, Activity, Bot } from "lucide-react";
import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string | undefined;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5" data-testid={`stat-${label}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {value === undefined ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visao geral do servidor</p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Bot className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">{stats.botStatus || "Online"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Membros" value={statsLoading ? undefined : stats?.totalMembers} icon={Users} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Online" value={statsLoading ? undefined : stats?.onlineMembers} icon={Activity} color="bg-green-500/10 text-green-400" />
        <StatCard label="Tickets" value={statsLoading ? undefined : stats?.openTickets} icon={Ticket} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="Warns" value={statsLoading ? undefined : stats?.activeWarns} icon={Shield} color="bg-red-500/10 text-red-400" />
        <StatCard label="XP Total" value={statsLoading ? undefined : stats?.totalXpGiven} icon={Zap} color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Sorteios" value={statsLoading ? undefined : stats?.sorteiosAtivos} icon={Gift} color="bg-pink-500/10 text-pink-400" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Atividade Recente</h2>
        {activityLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-2" data-testid="activity-list">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <Activity className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.description}</p>
                  {item.username && (
                    <p className="text-xs text-muted-foreground">{item.username}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhuma atividade recente</p>
        )}
      </div>
    </div>
  );
}
