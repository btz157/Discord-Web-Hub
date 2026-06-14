import { useState } from "react";
import { Shield, Plus, Trash2, Clock } from "lucide-react";
import {
  useListWarns,
  useCreateWarn,
  useDeleteWarn,
  useListLogs,
  getListWarnsQueryKey,
  getListLogsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Moderation() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ discordId: "", username: "", reason: "", moderatorId: "web-admin", moderatorName: "Web Admin" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: warns, isLoading: warnsLoading } = useListWarns();
  const { data: logs, isLoading: logsLoading } = useListLogs({ limit: 20 });
  const createWarn = useCreateWarn();
  const deleteWarn = useDeleteWarn();

  function handleCreate() {
    if (!form.discordId || !form.username || !form.reason) return;
    createWarn.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWarnsQueryKey() });
          setOpen(false);
          setForm({ discordId: "", username: "", reason: "", moderatorId: "web-admin", moderatorName: "Web Admin" });
          toast({ title: "Warn adicionado com sucesso" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteWarn.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWarnsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
          toast({ title: "Warn removido" });
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderacao</h1>
          <p className="text-muted-foreground text-sm">Warns e logs de moderacao</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="btn-add-warn">
          <Plus className="w-4 h-4 mr-2" />
          Novo Warn
        </Button>
      </div>

      <Tabs defaultValue="warns">
        <TabsList>
          <TabsTrigger value="warns">Warns ({warns?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="logs">Logs de Moderacao</TabsTrigger>
        </TabsList>

        <TabsContent value="warns" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {warnsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : warns && warns.length > 0 ? (
              <div className="divide-y divide-border">
                {warns.map((warn) => (
                  <div
                    key={warn.id}
                    data-testid={`row-warn-${warn.id}`}
                    className="flex items-start justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{warn.username}</p>
                          <Badge variant="destructive" className="text-xs">Warn</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{warn.reason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Por {warn.moderatorName} &middot;{" "}
                          {new Date(warn.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(warn.id)}
                      data-testid={`btn-delete-warn-${warn.id}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">Nenhum warn registrado</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {logsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    data-testid={`row-log-${log.id}`}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{log.type}</Badge>
                        <span className="text-sm text-foreground">{log.action}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.moderatorName} &rarr; {log.targetName}
                        {log.reason && ` &middot; ${log.reason}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">Nenhum log encontrado</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Warn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Discord ID</Label>
              <Input
                data-testid="input-warn-discord-id"
                placeholder="123456789012345678"
                value={form.discordId}
                onChange={(e) => setForm((f) => ({ ...f, discordId: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                data-testid="input-warn-username"
                placeholder="Nome do usuario"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input
                data-testid="input-warn-reason"
                placeholder="Motivo do warn"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createWarn.isPending}
              data-testid="btn-confirm-warn"
            >
              {createWarn.isPending ? "Adicionando..." : "Adicionar Warn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
