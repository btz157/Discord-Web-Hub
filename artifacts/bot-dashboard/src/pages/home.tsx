import { Link } from "wouter";
import { Bot, Shield, Ticket, Gift, Zap, Megaphone, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Shield, label: "Moderacao", desc: "Warns, kicks, bans, mutes" },
  { icon: Ticket, label: "Tickets", desc: "Suporte automatizado" },
  { icon: Gift, label: "Sorteios", desc: "Giveaways com um clique" },
  { icon: Zap, label: "XP e Niveis", desc: "Gamificacao completa" },
  { icon: Megaphone, label: "Anuncios", desc: "Comunicados para o servidor" },
  { icon: Users, label: "Cargos", desc: "Cargos selecionaveis" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
          <Bot className="w-9 h-9 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2 text-center">WS STORE Bot</h1>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Painel de controle completo para gerenciar seu servidor Discord com um bot poderoso.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="gap-2 mb-4" data-testid="btn-enter-dashboard">
            <Settings className="w-5 h-5" />
            Acessar Painel
          </Button>
        </Link>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
