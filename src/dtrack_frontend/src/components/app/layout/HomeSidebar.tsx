import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getActiveViewFromPath } from "@/lib/utils";
import {
  ChevronDownIcon,
  FileTextIcon,
  HomeIcon,
  LogOutIcon,
  ShoppingCartIcon,
  WalletIcon,
} from "lucide-react";
import { LogoIcon } from "@/components/icons/LogoIcon";
import SidebarLink from "./SidebarLink";

interface HomeSidebarProps {
  onLogout: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (isOpen: boolean) => void;
}

// SidebarLink component handles individual links (see ./SidebarLink.tsx)

const HomeSidebar: React.FC<HomeSidebarProps> = ({
  onLogout,
  isMobileNavOpen,
  setIsMobileNavOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // derive active view from current pathname
  const pathname = location.pathname;
  const activeView = getActiveViewFromPath(pathname);

  const isReportActive =
    activeView === "financial_report" || activeView === "market_report";
  const [isReportsOpen, setIsReportsOpen] = React.useState(isReportActive);

  React.useEffect(() => {
    if (isReportActive) setIsReportsOpen(true);
  }, [isReportActive]);

  // Navigation will be done inline in each onClick so the target path is explicit.

  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-muted/40">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-background">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <LogoIcon className="h-6 w-6 text-primary" />
          <span className="">Dtrack</span>
        </a>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <SidebarLink
            active={activeView === "home"}
            onClick={() => {
              navigate("/");
              setIsMobileNavOpen(false);
            }}
            Icon={HomeIcon}
            text="Home"
          />
          <SidebarLink
            active={activeView === "wallet"}
            onClick={() => {
              navigate("/accounts");
              setIsMobileNavOpen(false);
            }}
            Icon={WalletIcon}
            text="Wallet Address Management"
          />
          <SidebarLink
            active={activeView === "transactions"}
            onClick={() => {
              navigate("/history");
              setIsMobileNavOpen(false);
            }}
            Icon={ShoppingCartIcon}
            text="Transaction Dashboard"
          />

          <div className="grid items-start">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left ${
                isReportActive ? "bg-muted text-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-4 w-4" />
                <span>Report Management</span>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  isReportsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isReportsOpen && (
              <div className="grid gap-1 pl-9 pt-1">
                <SidebarLink
                  active={activeView === "financial_report"}
                  onClick={() => {
                    navigate("/financial-report");
                    setIsMobileNavOpen(false);
                  }}
                  text="Financial Report"
                />
                <SidebarLink
                  active={activeView === "market_report"}
                  onClick={() => {
                    navigate("/market-report");
                    setIsMobileNavOpen(false);
                  }}
                  text="Market Report"
                />
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-border bg-background">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm font-medium"
        >
          <LogOutIcon className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full border-r bg-transparent z-50 w-[220px] lg:w-[280px] transition-transform duration-300 ease-in-out 
                ${
                  isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default HomeSidebar;
