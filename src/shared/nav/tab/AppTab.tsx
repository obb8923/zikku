import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import {
  createBottomTabNavigator,
  TransitionPresets,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { MapStack } from '@nav/stack/MapStack';
import { ArchiveStack } from '@nav/stack/ArchiveStack';
import { MoreStack } from '@nav/stack/MoreStack';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
import MapIcon from '@assets/svgs/Map.svg';
import ArchiveIcon from '@assets/svgs/Archive.svg';
import MoreIcon from '@assets/svgs/More.svg';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
import CameraIcon from '@assets/svgs/Camera.svg';
import ImageIcon from '@assets/svgs/Image.svg';
import {LiquidGlassView} from '@components/LiquidGlassView';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { usePermissionStore } from '@stores/permissionStore';
import { RecordModal } from '@components/RecordModal';
export type AppTabParamList = {
  [TAB_NAME.MAP]: undefined;
  [TAB_NAME.ARCHIVE]: undefined;
  [TAB_NAME.MORE]: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const CustomTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  const isMapTabActive = state.routes[state.index]?.name === TAB_NAME.MAP;

  const archiveAndMoreRoutes = state.routes.filter(
    (route) =>
      route.name === TAB_NAME.ARCHIVE || route.name === TAB_NAME.MORE,
  );
  const insets = useSafeAreaInsets();
  const ensureCameraAndPhotos = usePermissionStore((s) => s.ensureCameraAndPhotos);
  const rootNavigation = useNavigation();

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    fileName?: string;
    type?: string;
  } | null>(null);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  const { cameraButtonTranslateY, galleryButtonTranslateY, buttonScale } = useMemo(() => {
    const cameraButtonTranslateY = fabAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -40],
    });
    const galleryButtonTranslateY = fabAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -100],
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
        setIsModalVisible(false);
        setSelectedImage(null);
        return;
      }

      const asset = response.assets[0];
      if (!asset.uri) {
        setIsModalVisible(false);
        setSelectedImage(null);
        return;
      }

      const image = {
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
        width: asset.width,
        height: asset.height,
      };

      setSelectedImage(image);
      setIsModalVisible(true);
    },
    [],
  );

  const handleSelectFromGallery = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
      },
      handleImagePicked,
    );
    // 이미지 선택기를 먼저 열고, FAB는 백그라운드에서 닫기
    setTimeout(() => closeFab(), 0);
  }, [closeFab, handleImagePicked]);

  const handleTakePhoto = useCallback(async () => {
    launchCamera(
      {
        mediaType: 'photo',
      },
      handleImagePicked,
    );
    // 카메라를 먼저 열고, FAB는 백그라운드에서 닫기
    setTimeout(() => closeFab(), 0);
  }, [closeFab, handleImagePicked]);

  const handlePressMainFab = useCallback(() => {
    if (isFabOpen) {
      closeFab();
    } else {
      void openFab();
    }
  }, [isFabOpen, openFab, closeFab]);
  return (
    <View 
    pointerEvents={isMapTabActive ? 'auto' : 'none'}
    style={{
      position: 'absolute',
      bottom: insets.bottom + 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent', 
      paddingHorizontal: 16,
      opacity: isMapTabActive ? 1 : 0,
    }}
    >
      {/* 왼쪽: 탭들 (아이콘만, flex-1) */}
      <LiquidGlassView 
       className="flex-1 flex-row justify-start gap-6"
       innerStyle={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginRight: 16,
        height: 56,
       }}
      >
        {archiveAndMoreRoutes.map((route, index) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const { options } = descriptors[route.key];
          const size = 24;

          const icon =
            options.tabBarIcon?.({
              focused: isFocused,
              size,
              color: 'black',
            }) ?? null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              className="items-center justify-center"
              style={{
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </LiquidGlassView>
      {/* 갤러리 버튼 */}
      <Animated.View
        pointerEvents={isFabOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 10,
          right: 16,
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
          bottom: insets.bottom + 10,
          right: 16,
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
        <LiquidGlassButton
          onPress={handlePressMainFab}
          size="large"
        >
          <PlusSmall width={24} height={24} color="black" />
        </LiquidGlassButton>
      </Animated.View>

      {/* 기록 모달 */}
      <RecordModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedImage(null);
        }}
        image={selectedImage}
      />
    </View>
  );
};

export const AppTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          overflow: 'visible',
        },
        animationEnabled: true,
        ...TransitionPresets.ShiftTransition,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name={TAB_NAME.MAP}
        component={MapStack}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color, size }) => (
            <MapIcon width={size} height={size} color="black" />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.ARCHIVE}
        component={ArchiveStack}
        options={{
          tabBarLabel: '아카이브',
          tabBarIcon: ({ color, size }) => (
            <ArchiveIcon width={size} height={size} color="black" />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.MORE}
        component={MoreStack}
        options={{
          tabBarLabel: '더보기',
          tabBarIcon: ({ color, size }) => (
            <MoreIcon width={size} height={size} color="black" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
