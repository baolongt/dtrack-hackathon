import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ROUTE_VIEW_MAP } from "./const"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const truncatePrincipal = (principal: string) => {
  if (principal.length <= 11) return principal;
  return `${principal.slice(0, 7)}...${principal.slice(-4)}`;
}

export const icpToUsd = (icp: number): number => {
  return icp * 5;
}

// Derive a simple view key from a pathname. Used by Header and Sidebar.
export const getActiveViewFromPath = (pathname: string) => {
  return ROUTE_VIEW_MAP[pathname] || "";
};