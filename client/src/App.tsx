import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Siftly } from "@/pages/Siftly";
import { AdminContacts } from "@/pages/AdminContacts";
import { AdminLogin } from "@/pages/AdminLogin";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Siftly} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/contacts" component={AdminContacts} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

import { ChatWidget } from "@/components/ChatWidget";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
