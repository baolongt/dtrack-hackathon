import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useInternetIdentity } from "ic-use-internet-identity";
import { TransactionChartTabs } from "./components/app/Chart";
import { TransactionHistory } from "./components/app/TransactionHistory";
import { LabeledAccounts } from "./components/app/LabeledAccounts";
import { FinancialOverview } from "./components/app/FinancialOverview";
import { WebAnalytics } from "./components/app/WebAnalytics";
import { LoginButton } from "./components/auth/LoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard Overview", key: "dashboard" },
    { path: "/history", label: "Transaction History", key: "history" },
    { path: "/accounts", label: "Accounts", key: "tracking" },
    { path: "/analytics", label: "Analytics", key: "analytics" },
  ];

  return (
    <aside className="w-[20%] bg-card rounded-lg border p-6">
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

// Dashboard component that combines financial overview and charts
function Dashboard() {
  return (
    <div className="space-y-6">
      <FinancialOverview />
      <TransactionChartTabs />
    </div>
  );
}

// Login required screen
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

// Main content component
function MainContent() {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  if (!isLoggedIn) {
    return (
      <section className="w-full max-w-4xl">
        <LoginRequired />
      </section>
    );
  }

  return (
    <section className="w-[70%]">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/accounts" element={<LabeledAccounts />} />
        <Route path="/analytics" element={<WebAnalytics />} />
      </Routes>
    </section>
  );
}

function App() {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="w-full border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  DTrack Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track and analyze your transactions
                </p>
              </div>
              <LoginButton />
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="container mx-auto px-4 py-6">
          <div
            className={`flex gap-6 min-h-[calc(100vh-120px)] ${
              !isLoggedIn ? "justify-center" : ""
            }`}
          >
            {isLoggedIn && <Navigation />}
            <MainContent />
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
