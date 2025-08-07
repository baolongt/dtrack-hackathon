import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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