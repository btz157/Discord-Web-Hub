import { useState } from "react";
import { Zap, Trophy, Edit3 } from "lucide-react";
import {
  useGetXpLeaderboard,
  useUpdateMemberXp,
  getGetXpLeaderboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const rankColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const rankBg = ["bg-yellow-500/10", "bg-slate-400/10", "bg-amber-600/10"];

export default function Gamification() {
  const [editEntry, setEditEntry] = useState<{ discordId: string; username: string; xp: number; level: number } | null>(null);
  const [editXp, setEditXp] = useState(0);
  const [editLevel, setEditLevel] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leaderboard, isLoading } = useGetXpLeaderboard({ limit: 20 });
  const updateXp = useUpdateMemberXp();

  function openEdit(entry: { discordId: string; username: string; xp: number; level: number }) {
    setEditEntry(entry);
    setEditXp(entry.xp);
    setEditLevel(entry.level);
  }

  function handleSave() {
    if (!editEntry) return;
    updateXp.mutate(
      { discordId: editEntry.discordId, data: { xp: editXp, level: editLevel } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetXpLeaderboardQueryKey() });
          setEditEntry(null);
          toast({ title: "XP atualizado!" });
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gamificacao</h1>
        <p className="text-muted-foreground text-sm">Ranking de XP e niveis do servidor</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Leaderboard</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="divide-y divide-border">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.discordId}
                data-testid={`row-xp-${entry.discordId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg[idx] ?? "bg-secondary"}`}>
                  <span className={rankColors[idx] ?? "text-muted-foreground"}>#{idx + 1}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <Zap className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.username}</p>
                  <p className="text-xs text-muted-foreground">{entry.xp} XP</p>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">Lv {entry.level}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(entry)}
                  data-testid={`btn-edit-xp-${entry.discordId}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum membro com XP ainda</p>
          </div>
        )}
      </div>

      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar XP: {editEntry?.username}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>XP</Label>
              <Input
                data-testid="input-edit-xp"
                type="number"
                min={0}
                value={editXp}
                onChange={(e) => setEditXp(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Input
                data-testid="input-edit-level"
                type="number"
                min={1}
                value={editLevel}
                onChange={(e) => setEditLevel(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateXp.isPending} data-testid="btn-save-xp">
              {updateXp.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
