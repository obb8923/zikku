import { create } from 'zustand';
import Geolocation from '@react-native-community/geolocation'; 
import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  fetchLocation: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  error: null,
  isLoading: false,
  fetchLocation: async () => {
    set({ isLoading: true, error: null });
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    
    try {
      console.log('[LocationStore] Requesting permission:', permission);
      const permissionStatus = await request(permission);
      console.log('[LocationStore] Permission status received:', permissionStatus);

      if (permissionStatus !== RESULTS.GRANTED) {
        // App.tsx에서 이미 권한을 확인하고 호출하므로, 여기서는 request의 결과가 GRANTED가 아니면 바로 에러 처리
        set({ error: `Location permission not granted. Status: ${permissionStatus}`, isLoading: false });
        console.warn('[LocationStore] Permission not granted:', permissionStatus);
        return;
      }
      
      console.log('[LocationStore] Permission granted. Fetching current position...');
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('[LocationStore] Position received:', position);
          set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isLoading: false,
            error: null,
          });
        },
        (error) => {
          console.log('[LocationStore] Geolocation.getCurrentPosition error:', error);
          set({ error: `Geolocation error: ${error.code} - ${error.message}`, isLoading: false });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
      );
    } catch (err: any) {
      console.error('[LocationStore] Permission request or other error in fetchLocation:', err);
      set({ error: `Failed to fetch location: ${err.message}`, isLoading: false });
    }
  },
})); 