import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/:rest*">
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
      </Route>
    </Switch>
  );
}

function App() {
  // Force dark mode
  if (typeof window !== "undefined") {
    document.documentElement.classList.add("dark");
  }

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
