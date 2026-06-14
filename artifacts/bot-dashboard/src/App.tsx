import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Moderation from "@/pages/moderation";
import Tickets from "@/pages/tickets";
import Sorteios from "@/pages/sorteios";
import Roles from "@/pages/roles";
import Gamification from "@/pages/gamification";
import Anuncios from "@/pages/anuncios";
import Config from "@/pages/config";
import { useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/membros" component={Members} />
        <Route path="/moderacao" component={Moderation} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/sorteios" component={Sorteios} />
        <Route path="/roles" component={Roles} />
        <Route path="/gamificacao" component={Gamification} />
        <Route path="/anuncios" component={Anuncios} />
        <Route path="/config" component={Config} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/:rest*" component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  document.documentElement.classList.add("dark");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
