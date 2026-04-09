import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStorageUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "http://127.0.0.1:8000/storage";
  return `${baseUrl}/${path}`;
}
