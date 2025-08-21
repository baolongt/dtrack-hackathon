import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useInternetIdentity } from "ic-use-internet-identity";
import DashboardPage from "@/components/pages/Dashboard";
import HistoryPage from "@/components/pages/History";
import AccountsPage from "@/components/pages/Accounts";
import AnalyticsPage from "@/components/pages/Analytics";
import { LoginButton } from "./components/auth/LoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "./components/app/layout/Header";
import HomeSidebar from "./components/app/layout/HomeSidebar";

// Login required screen (reused)
function LoginRequired() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to DTrack</CardTitle>
          <CardDescription>
            Please login with Internet Identity to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}

const App: React.FC = () => {
  const { identity } = useInternetIdentity();

  // local UI/auth state; sync with Internet Identity when it changes
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(
    !!identity
  );
  const [transactions, setTransactions] = React.useState<any[]>([]); // initial data can be wired later
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsAuthenticated(!!identity);
  }, [identity]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // optionally navigate to home — router will render '/'
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setIsAuthenticated(false);
      // If you need to clear identity from Internet Identity client, do it where LoginButton exposes it
    }
  };

  // When not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoginRequired />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen w-full bg-muted/40">
        <HomeSidebar
          onLogout={handleLogout}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
        />
        <div className="flex flex-col md:ml-[220px] lg:ml-[280px]">
          <Header onMenuClick={() => setIsMobileNavOpen((s) => !s)} />
          <main className="container mx-auto px-4 py-6 pt-24">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
