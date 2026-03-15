import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY_STORAGE_KEY = "aamva_form_encryption_key_v1";

function getOrCreateSecretKey(): string {
  const existingKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
  if (existingKey) return existingKey;

  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const newKey = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, newKey);
  return newKey;
}

const encryptedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const encrypted = localStorage.getItem(name);
    if (!encrypted) return null;
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, getOrCreateSecretKey());
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encrypted = CryptoJS.AES.encrypt(value, getOrCreateSecretKey()).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  }
};

export type Theme = "light" | "dark" | "dmv";

const HISTORY_LIMIT = 20;

export interface FormState {
  state: string;
  version: string;
  strictMode: boolean;
  subfileType: "DL" | "ID";
  fields: Record<string, string>;
  theme: Theme;
  // undo/redo stacks — not persisted
  _history: Array<Record<string, string>>;
  _future: Array<Record<string, string>>;
  setField: (code: string, value: string) => void;
  setStateVersion: (state: string, version: string) => void;
  setStrictMode: (mode: boolean) => void;
  setSubfileType: (type: "DL" | "ID") => void;
  setTheme: (theme: Theme) => void;
  clearFields: () => void;
  loadJson: (data: Record<string, string>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      state: "CA",
      version: "10",
      strictMode: false,
      subfileType: "DL",
      fields: {},
      theme: "light",
      _history: [],
      _future: [],

      setField: (code, value) =>
        set((s) => {
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            fields: { ...s.fields, [code]: value },
            _history: history,
            _future: []
          };
        }),

      setStateVersion: (stateCode, version) => set(() => ({ state: stateCode, version })),

      setStrictMode: (mode) => set({ strictMode: mode }),

      setSubfileType: (type) => set({ subfileType: type }),

      setTheme: (theme) => set({ theme }),

      clearFields: () =>
        set((s) => ({
          fields: {},
          _history: [...s._history, s.fields].slice(-HISTORY_LIMIT),
          _future: []
        })),

      loadJson: (data) =>
        set((s) => {
          const { state: newState, version, ...rest } = data;
          const newFields = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, String(v)])
          );
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            state: newState || s.state,
            version: version || s.version,
            fields: newFields,
            _history: history,
            _future: []
          };
        }),

      undo: () =>
        set((s) => {
          if (s._history.length === 0) return s;
          const prev = s._history[s._history.length - 1];
          const history = s._history.slice(0, -1);
          const future = [s.fields, ...s._future].slice(0, HISTORY_LIMIT);
          return { fields: prev, _history: history, _future: future };
        }),

      redo: () =>
        set((s) => {
          if (s._future.length === 0) return s;
          const next = s._future[0];
          const future = s._future.slice(1);
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return { fields: next, _history: history, _future: future };
        }),

      canUndo: () => get()._history.length > 0,
      canRedo: () => get()._future.length > 0
    }),
    {
      name: "aamva_form_data_secure",
      storage: createJSONStorage(() => encryptedStorage),
      // Do not persist undo/redo stacks
      partialize: (s) => ({
        state: s.state,
        version: s.version,
        strictMode: s.strictMode,
        subfileType: s.subfileType,
        fields: s.fields,
        theme: s.theme
      })
    }
  )
);
