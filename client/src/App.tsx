import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import KnowledgeBase from "./pages/KnowledgeBase";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Drafts from "./pages/Drafts";
import DraftDetail from "./pages/DraftDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/companies" component={Companies} />
      <Route path="/companies/:id" component={CompanyDetail} />
      <Route path="/drafts" component={Drafts} />
      <Route path="/drafts/:id" component={DraftDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster theme="light" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;