import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  TransactionChartTabs,
  TransactionDataChartLine,
} from "./components/app/Chart";
import { TransactionHistory } from "./components/app/TransactionHistory";
import { TrackingAddress } from "./components/app/TrackingAddress";

// Navigation component
function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard Overview", key: "dashboard" },
    { path: "/history", label: "Transaction History", key: "history" },
    { path: "/tracking", label: "Tracking Address", key: "tracking" },
    { path: "/analytics", label: "Analytics", key: "analytics" },
  ];

  return (
    <aside className="w-[30%] bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      <div className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`block p-3 rounded-md text-sm transition-colors ${
              location.pathname === item.path
                ? "bg-muted/50 text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

// Main content component
function MainContent() {
  return (
    <section className="w-[70%]">
      <Routes>
        <Route path="/" element={<TransactionChartTabs />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/tracking" element={<TrackingAddress />} />
        <Route
          path="/analytics"
          element={
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Analytics</h2>
              <p className="text-muted-foreground">
                Analytics features coming soon...
              </p>
            </div>
          }
        />
      </Routes>
    </section>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="w-full border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              DTrack Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and analyze your transactions
            </p>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="container mx-auto px-4 py-6">
          <div className="flex gap-6 min-h-[calc(100vh-120px)]">
            <Navigation />
            <MainContent />
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
