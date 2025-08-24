import React from "react";

interface SidebarLinkProps {
  active?: boolean;
  onClick: () => void;
  Icon?: React.ComponentType<{ className?: string }>;
  text: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  active,
  onClick,
  Icon,
  text,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left ${
        active ? "bg-muted text-primary" : ""
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{text}</span>
    </button>
  );
};

export default SidebarLink;
