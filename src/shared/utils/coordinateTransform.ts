import { Region } from 'react-native-maps';

/**
 * 위도/경도를 화면 좌표로 변환하는 함수
 * Mercator 투영을 사용하여 변환합니다.
 */
export const latLngToScreen = (
  latitude: number,
  longitude: number,
  region: Region,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number } => {
  // Mercator 투영을 사용한 변환
  const lat = latitude;
  const lng = longitude;

  // 지도의 경계 좌표
  const minLat = region.latitude - region.latitudeDelta / 2;
  const maxLat = region.latitude + region.latitudeDelta / 2;
  const minLng = region.longitude - region.longitudeDelta / 2;
  const maxLng = region.longitude + region.longitudeDelta / 2;

  // 위도를 화면 Y 좌표로 변환 (위도는 반대 방향)
  const latRange = maxLat - minLat;
  const latRatio = latRange !== 0 ? (maxLat - lat) / latRange : 0;
  const y = latRatio * mapHeight;

  // 경도를 화면 X 좌표로 변환
  const lngRange = maxLng - minLng;
  const lngRatio = lngRange !== 0 ? (lng - minLng) / lngRange : 0;
  const x = lngRatio * mapWidth;

  return { x, y };
};

/**
 * 여러 위도/경도 좌표를 화면 좌표 배열로 변환
 */
export const latLngArrayToScreen = (
  coordinates: Array<{ latitude: number; longitude: number }>,
  region: Region,
  mapWidth: number,
  mapHeight: number,
): Array<{ x: number; y: number }> => {
  return coordinates.map((coord) =>
    latLngToScreen(coord.latitude, coord.longitude, region, mapWidth, mapHeight),
  );
};



