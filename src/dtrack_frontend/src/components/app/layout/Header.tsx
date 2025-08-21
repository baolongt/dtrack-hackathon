import React from "react";
import { useLocation } from "react-router-dom";
import { getActiveViewFromPath } from "@/lib/utils";
import { VIEW_TITLES } from "@/lib/const";
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const activeView = getActiveViewFromPath(pathname) || "home";
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 fixed top-0 left-0 right-0 z-30 md:left-[220px] lg:left-[280px] lg:h-[60px] lg:px-6">
      <button
        onClick={onMenuClick}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 md:hidden"
        aria-label="Toggle Menu"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold hidden md:block">
          {VIEW_TITLES[activeView]}
        </h1>
      </div>
      <div className="relative flex-1 md:grow-0">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px] h-9"
        />
      </div>
      <button className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10">
        <BellIcon className="h-5 w-5" />
        <span className="sr-only">Toggle notifications</span>
      </button>
    </header>
  );
};

export default Header;
