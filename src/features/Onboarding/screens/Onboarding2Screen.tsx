import React, { useCallback, useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { COLORS } from '@constants/COLORS';
import { useOnboarding } from '@hooks/useOnboarding';
import { usePermissionStore } from '@stores/permissionStore.ts';
import { PermissionRow } from '@features/Onboarding/components/PermissionRow';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';

import CameraIcon from '@assets/svgs/Camera.svg';
import ImageIcon from '@assets/svgs/Image.svg';
import MapIcon from '@assets/svgs/Map.svg';

type Onboarding2ScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding2'>;

export const Onboarding2Screen = (_props: Onboarding2ScreenProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['domain', 'common']);
  const { completeOnboarding } = useOnboarding();
  const {
    cameraPermission,
    photoLibraryPermission,
    locationPermission,
    requestAllPermissions,
  } = usePermissionStore();

  const [isRequesting, setIsRequesting] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const allGranted =
    cameraPermission && photoLibraryPermission && locationPermission && notificationGranted;


  const handleSkip = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  return (
    <Background isStatusBarGap={true} isTabBarGap={false} type="white">
      <View className="flex-1 px-6 justify-between">
        {/* 상단 설명 영역 */}
        <View className="mt-8">
          <Text
            text={t('onboarding.screen2.title')}
            type="title2"
            style={{ textAlign: 'left' }}
          />
          <View className="mt-4">
            <Text
              text={t('onboarding.screen2.description')}
              type="body3"
              style={{ color: '#4B5563' }}
            />
          </View>
        </View>

        {/* 권한 리스트 카드 */}
        <View className="px-5">
          <PermissionRow
            title={t('onboarding.screen2.permissions.camera.title')}
            description={t('onboarding.screen2.permissions.camera.description')}
            granted={cameraPermission}
            Icon={CameraIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title={t('onboarding.screen2.permissions.photo.title')}
            description={t('onboarding.screen2.permissions.photo.description')}
            granted={photoLibraryPermission}
            Icon={ImageIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title={t('onboarding.screen2.permissions.location.title')}
            description={t('onboarding.screen2.permissions.location.description')}
            granted={locationPermission}
            Icon={MapIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
        
        </View>

        {/* 하단 버튼 영역 */}
        <View
          style={{
            paddingBottom: insets.bottom + 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full rounded-full bg-greenTab items-center justify-center py-4"
            onPress={()=>{}}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color={COLORS.TEXT} />
            ) : (
              <Text
                text={
                  allGranted
                    ? t('onboarding.screen2.button.next')
                    : t('onboarding.screen2.button.allow_all')
                }
                type="body2"
                style={{ textAlign: 'center', color: COLORS.TEXT }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="mt-4 items-center justify-center"
            onPress={handleSkip}
          >
            <Text
              text={t('onboarding.screen2.button.skip')}
              type="caption1"
              style={{ textAlign: 'center', color: '#6B7280' }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
};