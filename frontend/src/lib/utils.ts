import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple event bus for global loading state
export const loadingEvents = {
  listeners: [] as ((loading: boolean) => void)[],
  subscribe(callback: (loading: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },
  setLoading(loading: boolean) {
    this.listeners.forEach(l => l(loading));
  }
};
