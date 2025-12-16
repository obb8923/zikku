import { create } from 'zustand';
import { Appearance } from 'react-native';
import { AsyncStorageService } from '@services/asyncStorageService';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';

export type ThemeMode = 'system' | 'dark' | 'light';
export type CurrentTheme = 'dark' | 'light';

interface ThemeStore {
  themeMode: ThemeMode;
  currentTheme: CurrentTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initializeTheme: () => Promise<void>;
}

const getSystemColorScheme = (): CurrentTheme => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

const calculateCurrentTheme = (mode: ThemeMode): CurrentTheme => {
  if (mode === 'system') {
    return getSystemColorScheme();
  }
  return mode;
};

export const useThemeStore = create<ThemeStore>((set, get) => {
  let appearanceListener: ReturnType<typeof Appearance.addChangeListener> | null = null;

  const updateCurrentTheme = (mode: ThemeMode) => {
    const newCurrentTheme = calculateCurrentTheme(mode);
    set({ currentTheme: newCurrentTheme });

    // system 모드일 때만 Appearance 리스너 등록
    if (mode === 'system') {
      if (appearanceListener) {
        appearanceListener.remove();
      }
      appearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
        const currentMode = get().themeMode;
        if (currentMode === 'system') {
          const newTheme = colorScheme === 'dark' ? 'dark' : 'light';
          set({ currentTheme: newTheme });
        }
      });
    } else {
      // system 모드가 아니면 리스너 제거
      if (appearanceListener) {
        appearanceListener.remove();
        appearanceListener = null;
      }
    }
  };

  return {
    themeMode: 'system',
    currentTheme: getSystemColorScheme(),

    setThemeMode: async (mode: ThemeMode) => {
      await AsyncStorageService.setItem(STORAGE_KEYS.THEME_MODE, mode);
      set({ themeMode: mode });
      updateCurrentTheme(mode);
    },

    initializeTheme: async () => {
      // 저장된 테마 모드 불러오기
      const savedMode = await AsyncStorageService.getItem(STORAGE_KEYS.THEME_MODE);
      const themeMode: ThemeMode =
        savedMode === 'system' || savedMode === 'dark' || savedMode === 'light'
          ? savedMode
          : 'system';

      set({ themeMode });
      updateCurrentTheme(themeMode);
    },
  };
});

