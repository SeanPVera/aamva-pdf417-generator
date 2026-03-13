import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

// Use a simple app-wide secret for local storage encryption (AES).
// This offers baseline obfuscation of PII data from other local scripts.
const SECRET_KEY = 'aamva-local-encryption-key-v1';

const encryptedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const encrypted = localStorage.getItem(name);
    if (!encrypted) return null;
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export interface FormState {
  state: string;
  version: string;
  strictMode: boolean;
  subfileType: 'DL' | 'ID';
  fields: Record<string, string>;
  setField: (code: string, value: string) => void;
  setStateVersion: (state: string, version: string) => void;
  setStrictMode: (mode: boolean) => void;
  setSubfileType: (type: 'DL' | 'ID') => void;
  clearFields: () => void;
  loadJson: (data: Record<string, string>) => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      state: 'CA',
      version: '10',
      strictMode: false,
      subfileType: 'DL',
      fields: {},
      setField: (code, value) =>
        set((state) => ({
          fields: { ...state.fields, [code]: value },
        })),
      setStateVersion: (stateCode, version) =>
        set(() => ({ state: stateCode, version })),
      setStrictMode: (mode) => set({ strictMode: mode }),
      setSubfileType: (type) => set({ subfileType: type }),
      clearFields: () => set({ fields: {} }),
      loadJson: (data) =>
        set((state) => {
          const { state: newState, version, ...fields } = data;
          return {
            state: newState || state.state,
            version: version || state.version,
            fields,
          };
        }),
    }),
    {
      name: 'aamva_form_data_secure',
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);