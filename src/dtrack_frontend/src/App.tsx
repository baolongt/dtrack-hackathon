import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useInternetIdentity } from "ic-use-internet-identity";
import DashboardPage from "@/components/pages/Dashboard";
import HistoryPage from "@/components/pages/History";
import AccountsPage from "@/components/pages/Accounts";
import AnalyticsPage from "@/components/pages/Analytics";
import { LoginButton } from "./components/auth/LoginButton";
import LoginPage from "./components/auth/LoginPage";
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
import MarketReports from "./components/pages/Markket";

// (LoginPage component moved to its own file)

const App: React.FC = () => {
  const { identity, status, clear } = useInternetIdentity();

  const { setIdentity, fetchAll } = useAccountStore(
    useShallow((s) => ({
      setIdentity: s.setIdentity,
      fetchAll: s.fetchAll,
    }))
  );
  const [transactions, setTransactions] = React.useState<any[]>([]); // initial data can be wired later
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Only treat the user as authenticated when the identity is available and the hook reports success.
    setIdentity(identity || null);
    // Debugging aid: uncomment during development to inspect identity/status
    // console.debug('useInternetIdentity', { identity, status });
    let triggerFetch = async () => {
      if (identity) {
        await fetchAll();
      }
    };
    triggerFetch();
  }, [identity]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      clear();
      setIdentity(null);
    }
  };

  // When not authenticated, show login screen
  if (!identity) {
    return <LoginPage />;
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
              <Route path="/market-report" element={<MarketReports />} />
              <Route path="/financial-report" element={<FinancialPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
