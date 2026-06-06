import { createClient } from "@supabase/supabase-js";

let authStorage: Storage = localStorage;

export function setAuthStorage(rememberMe: boolean): void {
  authStorage = rememberMe ? localStorage : sessionStorage;
}

const storageAdapter = {
  getItem: (key: string) => authStorage.getItem(key),
  setItem: (key: string, value: string) => authStorage.setItem(key, value),
  removeItem: (key: string) => authStorage.removeItem(key),
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { storage: storageAdapter } }
);
