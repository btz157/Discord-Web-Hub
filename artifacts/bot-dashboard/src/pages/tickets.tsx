import { useState } from "react";
import { Ticket, CheckCircle, XCircle } from "lucide-react";
import {
  useListTickets,
  useUpdateTicket,
  getListTicketsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Tickets() {
  const [status, setStatus] = useState<"open" | "closed" | "all">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tickets, isLoading } = useListTickets({ status });
  const updateTicket = useUpdateTicket();

  function handleClose(id: string) {
    updateTicket.mutate(
      { id, data: { status: "closed", closedBy: "Web Admin" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey({ status }) });
          toast({ title: "Ticket fechado" });
        },
      }
    );
  }

  function handleReopen(id: string) {
    updateTicket.mutate(
      { id, data: { status: "open" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey({ status }) });
          toast({ title: "Ticket reaberto" });
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
        <p className="text-muted-foreground text-sm">Gerenciar tickets de suporte</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="closed">Fechados</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-border bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground w-7" />
              <span className="text-xs font-semibold text-muted-foreground">Usuario</span>
              <span className="text-xs font-semibold text-muted-foreground w-24">Categoria</span>
              <span className="text-xs font-semibold text-muted-foreground w-20 text-center">Status</span>
              <span className="text-xs font-semibold text-muted-foreground w-24" />
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    data-testid={`row-ticket-${ticket.id}`}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                      <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ticket.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.subject || "Sem assunto"} &middot; {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="w-24">
                      <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                    </div>
                    <div className="w-20 text-center">
                      <Badge
                        variant={ticket.status === "open" ? "default" : "secondary"}
                        className={`text-xs ${ticket.status === "open" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
                      >
                        {ticket.status === "open" ? "Aberto" : "Fechado"}
                      </Badge>
                    </div>
                    <div className="w-24 flex justify-end">
                      {ticket.status === "open" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClose(ticket.id)}
                          data-testid={`btn-close-ticket-${ticket.id}`}
                          className="text-muted-foreground hover:text-destructive text-xs gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Fechar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReopen(ticket.id)}
                          data-testid={`btn-reopen-ticket-${ticket.id}`}
                          className="text-muted-foreground hover:text-primary text-xs gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Reabrir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">Nenhum ticket encontrado</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
