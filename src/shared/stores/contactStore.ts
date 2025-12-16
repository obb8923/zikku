import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactMinimal } from '@shared/types/contactType';
import { STORAGE_KEYS } from '@shared/constants/STORAGE_KEYS';
import { getAllContactsMinimal } from '@shared/services';

type ContactState = {
  contacts: ContactMinimal[];
  isLoading: boolean;
  error: string | null;
  loadContactsFromDevice: () => Promise<void>;
  clearContacts: () => void;
};

export const useContactStore = create<ContactState>()(
  persist(
    (set) => ({
      contacts: [],
      isLoading: false,
      error: null,
      loadContactsFromDevice: async () => {
        console.log('[ContactStore] loadContactsFromDevice called');
        try {
          set({ isLoading: true, error: null });
          console.log('[ContactStore] Calling getAllContactsMinimal...');
          const result = await getAllContactsMinimal();
          console.log('[ContactStore] Got contacts:', result.length);
          set({ contacts: result, isLoading: false });
        } catch (e: any) {
          console.error('[ContactStore] Error loading contacts:', e);
          set({
            error: e?.message ?? 'UNKNOWN_ERROR',
            isLoading: false,
          });
        }
      },
      clearContacts: () => set({ contacts: [] }),
    }),
    {
      name: STORAGE_KEYS.IMPORTED_CONTACTS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contacts: state.contacts,
      }),
    },
  ),
);









