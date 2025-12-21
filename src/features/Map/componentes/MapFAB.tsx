import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { usePermissionStore } from '@stores/permissionStore';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import CameraIcon from '@assets/svgs/Camera.svg';
import ImageIcon from '@assets/svgs/Image.svg';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
type MapScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'Map'>;

export const MapFAB = () => {
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
        width: asset.width,
        height: asset.height,
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
    <>
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
        <LiquidGlassButton onPress={handleSelectFromGallery} size="large">
          <ImageIcon width={24} height={24} color="black" />
        </LiquidGlassButton>
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
        <LiquidGlassButton onPress={handleTakePhoto} size="large">
          <CameraIcon width={24} height={24} color="black" />
        </LiquidGlassButton>
      </Animated.View>

      {/* 메인 FAB - 리퀴드글래스 버튼 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          opacity: isFabOpen ? 0.8 : 1,
          transform: [
            {
              rotate: fabAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '45deg'],
              }) as any,
            },
          ],
        }}
      >
        <LiquidGlassButton onPress={handlePressMainFab} size="large">
          <PlusSmall width={36} height={36} color="black" />
        </LiquidGlassButton>
      </Animated.View>
    </>
  );
};

