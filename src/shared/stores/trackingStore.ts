// 추적 권한 상태를 관리하는 스토어
import { create } from 'zustand';
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

// 추적 권한 상태 타입 정의
type TrackingStatus = 'not-determined' | 'denied' | 'authorized' | 'restricted';

interface TrackingState {
  trackingStatus: TrackingStatus;
  isTrackingAuthorized: boolean;
  setTrackingStatus: (status: TrackingStatus) => void;
  requestTrackingPermission: () => Promise<TrackingStatus>;
  checkTrackingStatus: () => Promise<TrackingStatus>;
}

export const useTrackingStore = create<TrackingState>((set, _get) => ({
  trackingStatus: 'not-determined',
  isTrackingAuthorized: false,

  setTrackingStatus: (status: TrackingStatus) => {
    set({ 
      trackingStatus: status,
      isTrackingAuthorized: status === 'authorized'
    });
  },

  requestTrackingPermission: async (): Promise<TrackingStatus> => {
    try {
      const status = await requestTrackingPermission();
      const trackingStatus = status as TrackingStatus;
      
      set({ 
        trackingStatus,
        isTrackingAuthorized: trackingStatus === 'authorized'
      });
      
      return trackingStatus;
    } catch (error) {
      console.error('[TrackingStore] Error requesting tracking permission:', error);
      set({ 
        trackingStatus: 'denied',
        isTrackingAuthorized: false
      });
      return 'denied';
    }
  },

  checkTrackingStatus: async (): Promise<TrackingStatus> => {
    try {
      const status = await getTrackingStatus();
      const trackingStatus = status as TrackingStatus;
      
      set({ 
        trackingStatus,
        isTrackingAuthorized: trackingStatus === 'authorized'
      });
      
      return trackingStatus;
    } catch (error) {
      console.error('[TrackingStore] Error checking tracking status:', error);
      set({ 
        trackingStatus: 'denied',
        isTrackingAuthorized: false
      });
      return 'denied';
    }
  },
}));
