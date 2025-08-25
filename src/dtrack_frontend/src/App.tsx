import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import useAccountStore from "./stores/account.store";
import { useShallow } from "zustand/shallow";
import FinancialPage from "./components/pages/Financial";

// Login required screen (reused)
function LoginRequired() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center p-6">
          <CardTitle className="text-2xl">Welcome to DTrack</CardTitle>
          <CardDescription className="mt-2">
            Please login with Internet Identity to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="w-full flex justify-center">
            <LoginButton />
          </div>
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
  const { setIdentity, fetchAll } = useAccountStore(
    useShallow((s) => ({
      setIdentity: s.setIdentity,
      fetchAll: s.fetchAll,
    }))
  );
  const [transactions, setTransactions] = React.useState<any[]>([]); // initial data can be wired later
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsAuthenticated(!!identity);
    setIdentity(identity || null);
    let triggerFetch = async () => {
      if (identity) {
        await fetchAll();
      }
    };
    triggerFetch();
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
    return <LoginRequired />;
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
              <Route path="/market-report" element={<FinancialPage />} />
              <Route path="/financial-report" element={<FinancialPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
