import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import {
  useGetConfig,
  useUpdateConfig,
  getGetConfigQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Config() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading } = useGetConfig();
  const updateConfig = useUpdateConfig();

  const [form, setForm] = useState({
    prefix: "!",
    welcomeChannelId: "",
    logChannelId: "",
    modLogChannelId: "",
    ticketCategoryId: "",
    autoroleId: "",
    xpEnabled: true,
    xpMultiplier: 1.0,
    maxWarns: 3,
    muteRoleId: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        prefix: config.prefix || "!",
        welcomeChannelId: config.welcomeChannelId || "",
        logChannelId: config.logChannelId || "",
        modLogChannelId: config.modLogChannelId || "",
        ticketCategoryId: config.ticketCategoryId || "",
        autoroleId: config.autoroleId || "",
        xpEnabled: config.xpEnabled ?? true,
        xpMultiplier: config.xpMultiplier ?? 1.0,
        maxWarns: config.maxWarns ?? 3,
        muteRoleId: config.muteRoleId || "",
      });
    }
  }, [config]);

  function handleSave() {
    updateConfig.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
          toast({ title: "Configuracoes salvas!" });
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
          <p className="text-muted-foreground text-sm">Ajustes gerais do bot</p>
        </div>
        <Button onClick={handleSave} disabled={updateConfig.isPending || isLoading} data-testid="btn-save-config">
          <Save className="w-4 h-4 mr-2" />
          {updateConfig.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" /> Geral
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prefixo do Bot</Label>
                <Input
                  data-testid="input-prefix"
                  value={form.prefix}
                  onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
                  placeholder="!"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Warns para Banimento</Label>
                <Input
                  data-testid="input-max-warns"
                  type="number"
                  min={1}
                  value={form.maxWarns}
                  onChange={(e) => setForm((f) => ({ ...f, maxWarns: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Canais</h2>
            <div className="space-y-3">
              {[
                { key: "welcomeChannelId", label: "Canal de Boas-vindas" },
                { key: "logChannelId", label: "Canal de Logs Gerais" },
                { key: "modLogChannelId", label: "Canal de Logs de Moderacao" },
                { key: "ticketCategoryId", label: "Categoria de Tickets" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    data-testid={`input-${key}`}
                    value={(form as Record<string, string | boolean | number>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder="ID do canal/categoria"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">Cargos</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Autorole (cargo ao entrar)</Label>
                <Input
                  data-testid="input-autorole"
                  value={form.autoroleId}
                  onChange={(e) => setForm((f) => ({ ...f, autoroleId: e.target.value }))}
                  placeholder="ID do cargo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo de Mute</Label>
                <Input
                  data-testid="input-mute-role"
                  value={form.muteRoleId}
                  onChange={(e) => setForm((f) => ({ ...f, muteRoleId: e.target.value }))}
                  placeholder="ID do cargo muted"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">XP e Gamificacao</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  data-testid="switch-xp-enabled"
                  checked={form.xpEnabled}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, xpEnabled: checked }))}
                />
                <Label>Sistema de XP ativo</Label>
              </div>
              <div className="space-y-1.5">
                <Label>Multiplicador de XP</Label>
                <Input
                  data-testid="input-xp-multiplier"
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={form.xpMultiplier}
                  onChange={(e) => setForm((f) => ({ ...f, xpMultiplier: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
