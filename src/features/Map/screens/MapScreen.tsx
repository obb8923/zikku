import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { usePermissionStore } from '@stores/permissionStore';

type MapScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'Map'>;

export const MapScreen = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const ensureCameraAndPhotos = usePermissionStore((s) => s.ensureCameraAndPhotos);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

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
    <View className="flex-1 bg-blue-500">
      <View className="flex-1 items-center justify-center">
        <Text>MapScreen</Text>
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