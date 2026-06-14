import { useState } from "react";
import { Gift, Plus, Trash2, Trophy } from "lucide-react";
import {
  useListSorteios,
  useCreateSorteio,
  useDeleteSorteio,
  useDrawSorteio,
  getListSorteiosQueryKey,
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

export default function Sorteios() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ prize: "", description: "", createdBy: "Web Admin", endAt: "", winners: 1 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sorteios, isLoading } = useListSorteios();
  const createSorteio = useCreateSorteio();
  const deleteSorteio = useDeleteSorteio();
  const drawSorteio = useDrawSorteio();

  function handleCreate() {
    if (!form.prize || !form.endAt) return;
    createSorteio.mutate(
      { data: { ...form, endAt: new Date(form.endAt).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSorteiosQueryKey() });
          setOpen(false);
          setForm({ prize: "", description: "", createdBy: "Web Admin", endAt: "", winners: 1 });
          toast({ title: "Sorteio criado!" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteSorteio.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSorteiosQueryKey() });
        toast({ title: "Sorteio removido" });
      },
    });
  }

  function handleDraw(id: string) {
    drawSorteio.mutate({ id }, {
      onSuccess: (s) => {
        queryClient.invalidateQueries({ queryKey: getListSorteiosQueryKey() });
        toast({ title: `Ganhador(es) sorteados! IDs: ${(s.winnerIds ?? []).join(", ") || "nenhum"}` });
      },
    });
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    ended: "bg-muted text-muted-foreground",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sorteios</h1>
          <p className="text-muted-foreground text-sm">Criar e gerenciar giveaways</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="btn-new-sorteio">
          <Plus className="w-4 h-4 mr-2" />
          Novo Sorteio
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : sorteios && sorteios.length > 0 ? (
          sorteios.map((s) => (
            <div
              key={s.id}
              data-testid={`card-sorteio-${s.id}`}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{s.prize}</p>
                    <Badge variant="outline" className={`text-xs ${statusColors[s.status]}`}>
                      {s.status === "active" ? "Ativo" : s.status === "ended" ? "Encerrado" : "Cancelado"}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mb-1">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{s.participants} participantes</span>
                    <span>{s.winners} ganhador(es)</span>
                    <span>Encerra: {new Date(s.endAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {(s.winnerIds ?? []).length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-400">Ganhadores: {(s.winnerIds ?? []).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDraw(s.id)}
                    data-testid={`btn-draw-${s.id}`}
                    className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 text-xs gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Sortear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id)}
                  data-testid={`btn-delete-sorteio-${s.id}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum sorteio ainda. Crie o primeiro!</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Sorteio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Premio</Label>
              <Input
                data-testid="input-sorteio-prize"
                placeholder="Ex: Nitro Classic"
                value={form.prize}
                onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descricao (opcional)</Label>
              <Input
                data-testid="input-sorteio-desc"
                placeholder="Descricao do sorteio"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data de Encerramento</Label>
                <Input
                  data-testid="input-sorteio-end"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Numero de Ganhadores</Label>
                <Input
                  data-testid="input-sorteio-winners"
                  type="number"
                  min={1}
                  value={form.winners}
                  onChange={(e) => setForm((f) => ({ ...f, winners: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createSorteio.isPending}
              data-testid="btn-confirm-sorteio"
            >
              {createSorteio.isPending ? "Criando..." : "Criar Sorteio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
