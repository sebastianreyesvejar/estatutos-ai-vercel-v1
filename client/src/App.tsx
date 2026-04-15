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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

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
