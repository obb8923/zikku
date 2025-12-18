import { useEffect, useRef } from 'react';
import Geolocation, { GeoPosition } from '@react-native-community/geolocation';
import { useTracesStore } from '@stores/tracesStore';
import { usePermissionStore } from '@stores/permissionStore';

const FIVE_SECONDS = 5000;
const FIVE_MINUTES = 5 * 60 * 1000;

export const useTraceRecorder = () => {
  const addLocalTrace = useTracesStore((s) => s.addLocalTrace);
  const flushPendingToRemote = useTracesStore((s) => s.flushPendingToRemote);
  const loadInitialTraces = useTracesStore((s) => s.loadInitialTraces);
  const requestLocationPermission = usePermissionStore((s) => s.requestLocationPermission);

  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    let isMounted = true;

    const start = async () => {
      await loadInitialTraces();

      const granted = await requestLocationPermission();
      if (!granted || !isMounted) return;

      watchIdRef.current = Geolocation.watchPosition(
        (position: GeoPosition) => {
          const { latitude, longitude } = position.coords;
          void addLocalTrace(latitude, longitude, new Date());
        },
        (error) => {
          if (__DEV__) {
            console.error('[useTraceRecorder] 위치 수신 에러', error);
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: FIVE_SECONDS,
          fastestInterval: FIVE_SECONDS,
        },
      );

      syncIntervalRef.current = setInterval(() => {
        void flushPendingToRemote();
      }, FIVE_MINUTES);
    };

    void start();

    return () => {
      isMounted = false;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [addLocalTrace, flushPendingToRemote, loadInitialTraces, requestLocationPermission]);
};


