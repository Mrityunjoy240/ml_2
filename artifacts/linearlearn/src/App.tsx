import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppStateProvider } from "@/context/AppState";
import { useEffect } from "react";

import AppLayout from "@/components/layout/AppLayout";
import Act0Landing from "@/pages/Act0Landing";
import Act1BigPicture from "@/pages/Act1BigPicture";
import Act2YourData from "@/pages/Act2YourData";
import Act3ReadingClues from "@/pages/Act3ReadingClues";
import Act4TheMath from "@/pages/Act4TheMath";
import Act5Training from "@/pages/Act5Training";
import Act6Prediction from "@/pages/Act6Prediction";
import Act7ReportCard from "@/pages/Act7ReportCard";
import Act8Transformation from "@/pages/Act8Transformation";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Act0Landing} />
      
      <Route path="/act/1">
        <AppLayout><Act1BigPicture /></AppLayout>
      </Route>
      <Route path="/act/2">
        <AppLayout><Act2YourData /></AppLayout>
      </Route>
      <Route path="/act/3">
        <AppLayout><Act3ReadingClues /></AppLayout>
      </Route>
      <Route path="/act/4">
        <AppLayout><Act4TheMath /></AppLayout>
      </Route>
      <Route path="/act/5">
        <AppLayout><Act5Training /></AppLayout>
      </Route>
      <Route path="/act/6">
        <AppLayout><Act6Prediction /></AppLayout>
      </Route>
      <Route path="/act/7">
        <AppLayout><Act7ReportCard /></AppLayout>
      </Route>
      <Route path="/act/8">
        <AppLayout><Act8Transformation /></AppLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export default App;
