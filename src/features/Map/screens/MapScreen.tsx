import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTracesStore } from '@stores/tracesStore';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { latLngToScreenPoint } from '../componentes/traceProjection';
import { useTraceRecorder } from '@libs/hooks/useTraceRecorder';

type MapScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'Map'>;

const INITIAL_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const MapScreen = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const ensureCameraAndPhotos = usePermissionStore((s) => s.ensureCameraAndPhotos);
  const requestLocationPermission = usePermissionStore((s) => s.requestLocationPermission);
  const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region | null>(INITIAL_REGION);
  const { width, height } = useWindowDimensions();

  const traces = useTracesStore((s) => s.items);

  useTraceRecorder();

  // 화면 진입 시 위치 권한 요청
  useEffect(() => {
    void requestLocationPermission();
  }, [requestLocationPermission]);

  const { cameraButtonTranslateY, galleryButtonTranslateY, buttonScale } = useMemo(() => {
    const cameraButtonTranslateY = fabAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -80],
    });
    const galleryButtonTranslateY = fabAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -150],
    });
    const buttonScale = fabAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return { cameraButtonTranslateY, galleryButtonTranslateY, buttonScale };
  }, [fabAnimation]);

  const openFab = useCallback(async () => {
    const granted = await ensureCameraAndPhotos();
    if (!granted) return;

    setIsFabOpen(true);
    Animated.spring(fabAnimation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [ensureCameraAndPhotos, fabAnimation]);

  const closeFab = useCallback(() => {
    setIsFabOpen(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [fabAnimation]);

  const handleImagePicked = useCallback(
    (response: ImagePickerResponse) => {
      if (response.didCancel || !response.assets || response.assets.length === 0) {
        return;
      }

      const asset = response.assets[0];
      if (!asset.uri) {
        return;
      }

      const image = {
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
      };

      navigation.navigate('RecordCreate', { image });
    },
    [navigation],
  );

  const handleSelectFromGallery = useCallback(() => {
    closeFab();
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
      },
      handleImagePicked,
    );
  }, [closeFab, handleImagePicked]);

  const handleTakePhoto = useCallback(async () => {
    closeFab();
    launchCamera(
      {
        mediaType: 'photo',
      },
      handleImagePicked,
    );
  }, [closeFab, handleImagePicked]);

  const handlePressMainFab = useCallback(() => {
    if (isFabOpen) {
      closeFab();
    } else {
      void openFab();
    }
  }, [isFabOpen, openFab, closeFab]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={(region) => {
          regionRef.current = region;
        }}
        onUserLocationChange={(event) => {
          const coordinate = event.nativeEvent.coordinate;
          if (!coordinate) {
            return;
          }

          const { latitude, longitude } = coordinate;
          setCurrentLocation({ latitude, longitude });

          // 처음 위치를 받았을 때 지도의 중심을 현재 위치로 이동
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: INITIAL_REGION.latitudeDelta,
                longitudeDelta: INITIAL_REGION.longitudeDelta,
              },
              500,
            );
          }
        }}
      />

      {/* traces Skia 오버레이 */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Canvas style={StyleSheet.absoluteFillObject}>
          {regionRef.current && traces.length > 1 && (
            <Path
              path={(() => {
                const region = regionRef.current as Region;
                const first = traces[0];
                const firstPoint = latLngToScreenPoint(
                  first.latitude,
                  first.longitude,
                  region,
                  width,
                  height,
                );
                const skPath: SkPath = Skia.Path.Make();
                skPath.moveTo(firstPoint.x, firstPoint.y);
                for (let i = 1; i < traces.length; i++) {
                  const t = traces[i];
                  const p = latLngToScreenPoint(t.latitude, t.longitude, region, width, height);
                  skPath.lineTo(p.x, p.y);
                }
                return skPath;
              })()}
              strokeWidth={3}
              color="rgba(0, 150, 255, 0.8)"
              style="stroke"
            />
          )}
        </Canvas>
      </View>

      {/* 갤러리 버튼 */}
      <Animated.View
        pointerEvents={isFabOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          transform: [
            { translateY: galleryButtonTranslateY },
            { scale: buttonScale },
          ],
          opacity: fabAnimation,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          className="rounded-full bg-white px-5 py-3 flex-row items-center shadow-lg"
          onPress={handleSelectFromGallery}
        >
          <Text className="mr-2 text-base text-blue-500">📂</Text>
          <Text className="text-base font-medium text-blue-500">앨범에서 선택</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 카메라 버튼 */}
      <Animated.View
        pointerEvents={isFabOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          transform: [
            { translateY: cameraButtonTranslateY },
            { scale: buttonScale },
          ],
          opacity: fabAnimation,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          className="rounded-full bg-white px-5 py-3 flex-row items-center shadow-lg"
          onPress={handleTakePhoto}
        >
          <Text className="mr-2 text-base text-blue-500">📷</Text>
          <Text className="text-base font-medium text-blue-500">사진 촬영</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 메인 FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePressMainFab}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg"
        style={{ opacity: isFabOpen ? 0.8 : 1 }}
      >
        <Animated.Text
          className="text-3xl font-bold text-white"
          style={{
            transform: [
              {
                rotate: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          }}
        >
          +
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
};