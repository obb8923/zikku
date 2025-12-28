import { create } from 'zustand';
import Geolocation from '@react-native-community/geolocation'; 
import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  watchId: number | null;
  isFollowingUser: boolean; // 지도가 사용자 위치를 따라가는지 여부
  fetchLocation: () => void;
  startWatchingLocation: () => void;
  stopWatchingLocation: () => void;
  setLocation: (latitude: number, longitude: number) => void;
  setFollowUser: (follow: boolean) => void;
  toggleFollowUser: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  error: null,
  isLoading: false,
  watchId: null,
  isFollowingUser: true, // 기본값은 true
  fetchLocation: async () => {
    set({ isLoading: true, error: null });
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    
    try {
      const permissionStatus = await request(permission);

      if (permissionStatus !== RESULTS.GRANTED) {
        // App.tsx에서 이미 권한을 확인하고 호출하므로, 여기서는 request의 결과가 GRANTED가 아니면 바로 에러 처리
        set({ error: `Location permission not granted. Status: ${permissionStatus}`, isLoading: false });
        return;
      }
      
      Geolocation.getCurrentPosition(
        (position) => {
          set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            isLoading: false,
            error: null,
          });
        },
        (error) => {
          set({ error: `Geolocation error: ${error.code} - ${error.message}`, isLoading: false });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      set({ error: `Failed to fetch location: ${errorMessage}`, isLoading: false });
    }
  },
  setLocation: (latitude: number, longitude: number) => {
    set({ latitude, longitude });
  },
  startWatchingLocation: async () => {
    const { watchId } = get();
    // 이미 watching 중이면 중복 시작하지 않음
    if (watchId !== null) {
      return;
    }

    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    
    try {
      const permissionStatus = await request(permission);

      if (permissionStatus !== RESULTS.GRANTED) {
        set({ error: `Location permission not granted. Status: ${permissionStatus}` });
        return;
      }

      const id = Geolocation.watchPosition(
        (position) => {
          set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
          });
        },
        (error) => {
          set({ error: `Geolocation error: ${error.code} - ${error.message}` });
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 1000, // 1초 이내의 위치만 사용
          distanceFilter: 1, // 1m 이상 이동했을 때만 업데이트
        }
      );

      set({ watchId: id });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      set({ error: `Failed to start watching location: ${errorMessage}` });
    }
  },
  stopWatchingLocation: () => {
    const { watchId } = get();
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },
  setFollowUser: (follow: boolean) => {
    set({ isFollowingUser: follow });
  },
  toggleFollowUser: () => {
    set((state) => ({ isFollowingUser: !state.isFollowingUser }));
  },
})); 