import { useState } from "react";
import { Tag, Plus, Trash2, Users } from "lucide-react";
import {
  useListRoles,
  useCreateRole,
  useDeleteRole,
  getListRolesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function Roles() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roleId: "", roleName: "", description: "", emoji: "", color: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: roles, isLoading } = useListRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  function handleCreate() {
    if (!form.roleId || !form.roleName || !form.description || !form.emoji) return;
    createRole.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
          setOpen(false);
          setForm({ roleId: "", roleName: "", description: "", emoji: "", color: "" });
          toast({ title: "Cargo adicionado!" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteRole.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
        toast({ title: "Cargo removido" });
      },
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cargos Selecionaveis</h1>
          <p className="text-muted-foreground text-sm">Cargos que membros podem escolher</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="btn-add-role">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cargo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : roles && roles.length > 0 ? (
          roles.map((role) => (
            <div
              key={role.id}
              data-testid={`card-role-${role.id}`}
              className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: role.color ? `${role.color}22` : "hsl(var(--secondary))" }}
                >
                  {role.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{role.roleName}</p>
                  <p className="text-xs text-muted-foreground mb-1">{role.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{role.memberCount} membros</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(role.id)}
                data-testid={`btn-delete-role-${role.id}`}
                className="text-muted-foreground hover:text-destructive -mt-1 -mr-1"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="col-span-3 bg-card border border-border rounded-xl p-10 text-center">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum cargo selecionavel ainda</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Cargo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role ID do Discord</Label>
                <Input
                  data-testid="input-role-id"
                  placeholder="123456789012345678"
                  value={form.roleId}
                  onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome do Cargo</Label>
                <Input
                  data-testid="input-role-name"
                  placeholder="Nome visivel"
                  value={form.roleName}
                  onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descricao</Label>
              <Input
                data-testid="input-role-desc"
                placeholder="O que este cargo representa?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Emoji</Label>
                <Input
                  data-testid="input-role-emoji"
                  placeholder="Ex: 🎮"
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cor (hex, opcional)</Label>
                <Input
                  data-testid="input-role-color"
                  placeholder="#4d7fff"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createRole.isPending}
              data-testid="btn-confirm-role"
            >
              {createRole.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
