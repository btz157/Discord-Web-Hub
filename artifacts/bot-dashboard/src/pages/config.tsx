import { useEffect, useState } from "react";
import { Save, Hash, Volume2, FolderOpen, RefreshCw } from "lucide-react";
import {
  useGetConfig,
  useUpdateConfig,
  useGetDiscordChannels,
  useGetDiscordRoles,
  getGetConfigQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ChannelType = "text" | "voice" | "category" | "announcement" | "stage" | "forum" | string;

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  text: Hash,
  announcement: Hash,
  forum: Hash,
  voice: Volume2,
  stage: Volume2,
  category: FolderOpen,
};

function ChannelSelect({
  value,
  onChange,
  channels,
  types,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  channels: Array<{ id: string; name: string; type: string; parentName?: string | null }>;
  types?: ChannelType[];
  placeholder?: string;
  testId?: string;
}) {
  const filtered = types ? channels.filter((c) => types.includes(c.type)) : channels;

  return (
    <div className="relative">
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background pr-8"
      >
        <option value="">{placeholder ?? "— Nenhum —"}</option>
        {filtered.map((c) => {
          const Icon = CHANNEL_ICONS[c.type] ?? Hash;
          return (
            <option key={c.id} value={c.id}>
              {c.type === "category" ? "📁 " : c.type === "voice" || c.type === "stage" ? "🔊 " : "# "}
              {c.parentName ? `${c.parentName} / ` : ""}{c.name}
            </option>
          );
        })}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-1"
          title="Limpar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  roles,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  roles: Array<{ id: string; name: string; color?: string; managed?: boolean }>;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <div className="relative">
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background pr-8"
      >
        <option value="">{placeholder ?? "— Nenhum —"}</option>
        {roles.filter((r) => !r.managed).map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-1"
          title="Limpar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function SelectedBadge({
  id,
  channels,
  roles,
}: {
  id: string;
  channels?: Array<{ id: string; name: string; type: string }>;
  roles?: Array<{ id: string; name: string; color?: string }>;
}) {
  if (!id) return null;
  const channel = channels?.find((c) => c.id === id);
  const role = roles?.find((r) => r.id === id);
  const item = channel ?? role;
  if (!item) return <span className="text-xs text-muted-foreground font-mono">{id}</span>;

  const color = (role as { color?: string } | undefined)?.color;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={
        color && color !== "#000000"
          ? { borderColor: `${color}55`, background: `${color}18`, color }
          : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
      }
    >
      {channel ? (channel.type === "voice" ? "🔊" : "📁" === channel.type ? "📁" : "#") : "@"}
      {" "}{item.name}
    </span>
  );
}

export default function Config() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: config, isLoading } = useGetConfig();
  const { data: channels = [], isLoading: channelsLoading, refetch: refetchChannels } = useGetDiscordChannels();
  const { data: roles = [], isLoading: rolesLoading, refetch: refetchRoles } = useGetDiscordRoles();
  const updateConfig = useUpdateConfig();

  const discordLoading = channelsLoading || rolesLoading;
  const hasDiscord = channels.length > 0 || roles.length > 0;

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

  function handleRefresh() {
    refetchChannels();
    refetchRoles();
  }

  const textChannels = channels.filter((c) => ["text", "announcement", "forum"].includes(c.type));
  const categoryChannels = channels.filter((c) => c.type === "category");

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
          <p className="text-muted-foreground text-sm">Ajustes gerais do bot</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={discordLoading}
            title="Recarregar canais e cargos do Discord"
            data-testid="btn-refresh-discord"
          >
            <RefreshCw className={`w-4 h-4 ${discordLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfig.isPending || isLoading}
            data-testid="btn-save-config"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateConfig.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {!hasDiscord && !discordLoading && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          ⚠️ Bot nao conectado ou sem permissao no servidor. Verifique o <code className="font-mono">DISCORD_TOKEN</code> e <code className="font-mono">DISCORD_GUILD_ID</code>.
        </div>
      )}

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
        <div className="space-y-5">
          {/* Geral */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
              ⚙️ Geral
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prefixo do Bot</Label>
                <Input
                  data-testid="input-prefix"
                  value={form.prefix}
                  onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
                  placeholder="!"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Warns para Acao</Label>
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

          {/* Canais */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground"># Canais</h2>
              {discordLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Carregando canais...
                </span>
              )}
            </div>
            <div className="space-y-4">
              {[
                { key: "welcomeChannelId", label: "Canal de Boas-vindas", types: ["text", "announcement"] as ChannelType[] },
                { key: "logChannelId", label: "Canal de Logs Gerais", types: ["text", "announcement"] as ChannelType[] },
                { key: "modLogChannelId", label: "Canal de Logs de Moderacao", types: ["text", "announcement"] as ChannelType[] },
              ].map(({ key, label, types }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <SelectedBadge id={(form as Record<string, string | boolean | number>)[key] as string} channels={channels} />
                  </div>
                  {discordLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : hasDiscord ? (
                    <ChannelSelect
                      testId={`select-${key}`}
                      value={(form as Record<string, string | boolean | number>)[key] as string}
                      onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      channels={channels}
                      types={types}
                    />
                  ) : (
                    <Input
                      data-testid={`input-${key}`}
                      value={(form as Record<string, string | boolean | number>)[key] as string}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="ID do canal"
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              ))}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Categoria de Tickets</Label>
                  <SelectedBadge id={form.ticketCategoryId} channels={channels} />
                </div>
                {discordLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : hasDiscord ? (
                  <ChannelSelect
                    testId="select-ticketCategoryId"
                    value={form.ticketCategoryId}
                    onChange={(v) => setForm((f) => ({ ...f, ticketCategoryId: v }))}
                    channels={channels}
                    types={["category"]}
                    placeholder="— Nenhuma categoria —"
                  />
                ) : (
                  <Input
                    data-testid="input-ticketCategoryId"
                    value={form.ticketCategoryId}
                    onChange={(e) => setForm((f) => ({ ...f, ticketCategoryId: e.target.value }))}
                    placeholder="ID da categoria"
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Cargos */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">@ Cargos</h2>
              {discordLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Carregando cargos...
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "autoroleId", label: "Autorole (cargo ao entrar)" },
                { key: "muteRoleId", label: "Cargo de Mute" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{label}</Label>
                    <SelectedBadge id={(form as Record<string, string | boolean | number>)[key] as string} roles={roles} />
                  </div>
                  {discordLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : hasDiscord ? (
                    <RoleSelect
                      testId={`select-${key}`}
                      value={(form as Record<string, string | boolean | number>)[key] as string}
                      onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      roles={roles}
                    />
                  ) : (
                    <Input
                      data-testid={`input-${key}`}
                      value={(form as Record<string, string | boolean | number>)[key] as string}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="ID do cargo"
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* XP */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b border-border">
              ⚡ XP e Gamificacao
            </h2>
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
