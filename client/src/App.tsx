import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Navbar } from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import MerchantPanel from "./pages/MerchantPanel";
import CourierPanel from "./pages/CourierPanel";
import OrderTracking from "./pages/OrderTracking";

function Router() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={() => <Redirect to="/admin" />} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/merchant" component={MerchantPanel} />
          <Route path="/courier" component={CourierPanel} />
          <Route path="/order/:id" component={OrderTracking} />
          <Route path="/tracking/:id">
            {(params) => <Redirect to={`/order/${params.id}`} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
