import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import {
  useListAnuncios,
  useCreateAnuncio,
  useDeleteAnuncio,
  getListAnunciosQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function Anuncios() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", channelId: "", createdBy: "Web Admin", pingRole: "", embedColor: "#4d7fff" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: anuncios, isLoading } = useListAnuncios();
  const createAnuncio = useCreateAnuncio();
  const deleteAnuncio = useDeleteAnuncio();

  function handleCreate() {
    if (!form.title || !form.content || !form.channelId) return;
    createAnuncio.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAnunciosQueryKey() });
          setOpen(false);
          setForm({ title: "", content: "", channelId: "", createdBy: "Web Admin", pingRole: "", embedColor: "#4d7fff" });
          toast({ title: "Anuncio enviado!" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteAnuncio.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnunciosQueryKey() });
        toast({ title: "Anuncio removido" });
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Anuncios</h1>
          <p className="text-muted-foreground text-sm">Enviar comunicados para o servidor</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="btn-new-anuncio">
          <Plus className="w-4 h-4 mr-2" />
          Novo Anuncio
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : anuncios && anuncios.length > 0 ? (
          anuncios.map((a) => (
            <div
              key={a.id}
              data-testid={`card-anuncio-${a.id}`}
              className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: a.embedColor ? `${a.embedColor}22` : "hsl(var(--secondary))" }}
                >
                  <Megaphone className="w-5 h-5" style={{ color: a.embedColor || "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{a.content}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Canal: {a.channelId}</span>
                    {a.pingRole && <span>Ping: {a.pingRole}</span>}
                    <span>{new Date(a.sentAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(a.id)}
                data-testid={`btn-delete-anuncio-${a.id}`}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum anuncio enviado ainda</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Anuncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Titulo</Label>
              <Input
                data-testid="input-anuncio-title"
                placeholder="Titulo do anuncio"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conteudo</Label>
              <Textarea
                data-testid="input-anuncio-content"
                placeholder="Mensagem do anuncio..."
                rows={4}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ID do Canal</Label>
                <Input
                  data-testid="input-anuncio-channel"
                  placeholder="123456789012345678"
                  value={form.channelId}
                  onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ping Role (opcional)</Label>
                <Input
                  data-testid="input-anuncio-ping"
                  placeholder="ID do cargo"
                  value={form.pingRole}
                  onChange={(e) => setForm((f) => ({ ...f, pingRole: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cor do Embed</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.embedColor}
                  onChange={(e) => setForm((f) => ({ ...f, embedColor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <Input
                  value={form.embedColor}
                  onChange={(e) => setForm((f) => ({ ...f, embedColor: e.target.value }))}
                  className="flex-1"
                  placeholder="#4d7fff"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createAnuncio.isPending}
              data-testid="btn-confirm-anuncio"
            >
              {createAnuncio.isPending ? "Enviando..." : "Enviar Anuncio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
