// zustand를 이용한 권한 상태 관리 스토어
// 플랫폼별 권한 요청/확인 로직을 일관성 있게 관리합니다.

import { create } from 'zustand';
import { request, requestMultiple, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import { Platform } from 'react-native';

// 1. 권한 상태 타입 정의
// 앱에서 사용할 권한 관련 상태와 메서드 타입을 정의합니다.
interface PermissionState {
  cameraPermission: boolean; // 카메라 권한
  photoLibraryPermission: boolean; // 갤러리(사진) 권한
  locationPermission: boolean; // 위치 권한
  setCameraPermission: (granted: boolean) => void;
  setPhotoLibraryPermission: (granted: boolean) => void;
  setLocationPermission: (granted: boolean) => void;
  
  requestAllPermissions: () => Promise<boolean>; // 모든 권한 요청
  hasAllPermission: () => boolean; // 모든 권한 허용 여부
  isInitialized: boolean; // 권한 초기화 여부
  initPermissions: () => Promise<void>; // 권한 상태 초기화
  requestCameraPermission: () => Promise<boolean>; // 카메라 권한 요청
  requestPhotoLibraryPermission: () => Promise<boolean>; // 앨범(갤러리) 권한 요청
  requestLocationPermission: () => Promise<boolean>; // 위치 권한 요청

  // 카메라 + 갤러리 권한을 한 번에 보장해주는 헬퍼 (MapScreen 등에서 사용)
  ensureCameraAndPhotos: () => Promise<boolean>;
}

// 2. 플랫폼별 권한 → 상태 매핑 객체
// 복잡한 조건문 없이, 각 permission이 어떤 상태(camera, photoLibrary, location)에 해당하는지 명확히 매핑합니다.
const PERMISSION_MAPPING = {
  ios: {
    [PERMISSIONS.IOS.CAMERA]: 'cameraPermission',
    [PERMISSIONS.IOS.PHOTO_LIBRARY]: 'photoLibraryPermission',
    [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]: 'locationPermission',
  },
  android: {
    [PERMISSIONS.ANDROID.CAMERA]: 'cameraPermission',
    [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE]: 'photoLibraryPermission',
    [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES]: 'photoLibraryPermission',
    [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'locationPermission',
  },
} as const;

// 3. Android 버전에 따라 갤러리 권한 상수 결정 함수 - Android 13 이상은 READ_MEDIA_IMAGES, 그 이하는 READ_EXTERNAL_STORAGE 사용
const getGalleryPermission = () => {
  const version = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
  return version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
};

// 4. 권한 상태 업데이트 함수
// 매핑 객체를 활용해 permission에 해당하는 상태(camera, photoLibrary, location)를 일관성 있게 업데이트합니다.
const updatePermissionState = (permission: string, isGranted: boolean, set: (partial: Partial<PermissionState>) => void) => {
  const platform = Platform.OS as 'ios' | 'android';
  const permissionMapping = PERMISSION_MAPPING[platform];
  const permissionKey = permissionMapping[permission as keyof typeof permissionMapping];
  // permissionKey가 존재하면 해당 상태를 업데이트
  if (permissionKey) {
    set({ [permissionKey]: isGranted });
  }
};

// 5. zustand 스토어 생성
// 앱 전체에서 권한 상태를 관리하고, 권한 요청/초기화 메서드를 제공합니다.
export const usePermissionStore = create<PermissionState>((set, get) => ({
  cameraPermission: false, // 카메라 권한 상태
  photoLibraryPermission: false, // 갤러리(사진) 권한 상태
  locationPermission: false, // 위치 권한 상태
  isInitialized: false, // 권한 초기화 여부
  setCameraPermission: (granted) => set({ cameraPermission: granted }),
  setPhotoLibraryPermission: (granted) => set({ photoLibraryPermission: granted }),
  setLocationPermission: (granted) => set({ locationPermission: granted }),
  // 6. 모든 권한이 허용되었는지 확인
  hasAllPermission: () => {
    const state = get();
    return state.cameraPermission && state.photoLibraryPermission && state.locationPermission;
  },

  // 7. 권한 상태 초기화 함수
  // 앱 실행 시 권한 상태를 확인하고, 각 권한별로 상태를 업데이트합니다.
  initPermissions: async () => {
    try {
      // Android의 경우 버전에 따라 갤러리 권한 결정
      const galleryPermission = Platform.OS === 'android' ? getGalleryPermission() : null;

      // 플랫폼별 체크할 권한 목록
      const permissionsToCheck = Platform.select({
        ios: [
          PERMISSIONS.IOS.CAMERA,
          PERMISSIONS.IOS.PHOTO_LIBRARY,
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        ],
        android: [
          PERMISSIONS.ANDROID.CAMERA,
          galleryPermission,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ],
        default: [],
      });

      if (!permissionsToCheck || permissionsToCheck.length === 0) {
        set({ isInitialized: true });
        return;
      }

      // 각 권한별로 상태를 확인하고 업데이트
      for (const permission of permissionsToCheck) {
        if (!permission) continue;
        try {
          const status = await check(permission);
          const isGranted = status === RESULTS.GRANTED;
          updatePermissionState(permission, isGranted, set);
        } catch (error) {
          // 에러 발생 시 무시하고 계속 진행
        }
      }
      set({ isInitialized: true });
    } catch (error) {
      set({ isInitialized: true });
    }
  },
  
  // 카메라 권한 요청 함수
  requestCameraPermission: async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
        default: undefined,
      });

      if (!permission) return false;
      const status = await request(permission);
      const isGranted = status === RESULTS.GRANTED;
      updatePermissionState(permission, isGranted, set);
      return isGranted;
    } catch (error) {
      return false;
    }
  },

  // 앨범(갤러리) 권한 요청 함수
  requestPhotoLibraryPermission: async () => {
    try {
      let permission: typeof PERMISSIONS.IOS.PHOTO_LIBRARY | typeof PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE | typeof PERMISSIONS.ANDROID.READ_MEDIA_IMAGES | null = null;
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else if (Platform.OS === 'android') {
        permission = getGalleryPermission();
      }
      if (!permission) return false;
      const status = await request(permission);
      const isGranted = status === RESULTS.GRANTED;
      updatePermissionState(permission, isGranted, set);
      return isGranted;
    } catch (error) {
      return false;
    }
  },

  // 위치 권한 요청 함수
  requestLocationPermission: async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        default: undefined,
      });
      if (!permission) return false;
      const status = await request(permission);
      const isGranted = status === RESULTS.GRANTED;
      updatePermissionState(permission, isGranted, set);
      return isGranted;
    } catch (error) {
      return false;
    }
  },

  // 8. 권한 요청 함수 (각 권한별 요청 함수 결합)
  requestAllPermissions: async () => {
    try {
      const cameraGranted = await get().requestCameraPermission();
      const photoLibraryGranted = await get().requestPhotoLibraryPermission();
      const locationGranted = await get().requestLocationPermission();
      return cameraGranted && photoLibraryGranted && locationGranted;
    } catch (error) {
      return false;
    }
  },

  // 카메라 + 갤러리 권한을 한 번에 확인/요청하는 헬퍼
  ensureCameraAndPhotos: async () => {
    try {
      const cameraGranted = await get().requestCameraPermission();
      const photoLibraryGranted = await get().requestPhotoLibraryPermission();
      return cameraGranted && photoLibraryGranted;
    } catch (error) {
      return false;
    }
  },
})); 