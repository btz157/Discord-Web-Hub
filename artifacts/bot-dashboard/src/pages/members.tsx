import { useState } from "react";
import { Search, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useListMembers, getListMembersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function Members() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useListMembers({ page, search: search || undefined });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: getListMembersQueryKey({ page: 1, search: searchInput || undefined }) });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membros</h1>
          <p className="text-muted-foreground text-sm">Gerenciar membros do servidor</p>
        </div>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} membros</span>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-members"
            className="pl-9"
            placeholder="Buscar por nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" data-testid="btn-search">Buscar</Button>
      </form>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-border bg-muted/40">
          <span className="text-xs font-semibold text-muted-foreground w-8" />
          <span className="text-xs font-semibold text-muted-foreground">Membro</span>
          <span className="text-xs font-semibold text-muted-foreground text-center w-16">Level</span>
          <span className="text-xs font-semibold text-muted-foreground text-center w-14">XP</span>
          <span className="text-xs font-semibold text-muted-foreground text-center w-14">Warns</span>
        </div>
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        ) : data?.members && data.members.length > 0 ? (
          <div className="divide-y divide-border">
            {data.members.map((member) => (
              <div
                key={member.discordId}
                data-testid={`row-member-${member.discordId}`}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.displayName || member.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.discordId}</p>
                </div>
                <div className="w-16 text-center">
                  <Badge variant="secondary" className="text-xs">Lv {member.level ?? 0}</Badge>
                </div>
                <div className="w-14 text-center">
                  <span className="text-sm text-muted-foreground">{member.xp ?? 0}</span>
                </div>
                <div className="w-14 text-center">
                  {(member.warns ?? 0) > 0 ? (
                    <Badge variant="destructive" className="text-xs">{member.warns}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">0</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">Nenhum membro encontrado</p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {data.page} de {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-testid="btn-prev-page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-testid="btn-next-page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
