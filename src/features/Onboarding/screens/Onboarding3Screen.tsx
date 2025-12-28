import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Background, Text } from '@components/index';
import { useOnboarding } from '@hooks/useOnboarding';
import { usePermissionStore } from '@stores/permissionStore';
import { PermissionRow } from '@features/Onboarding/components/PermissionRow';
import { openSettings } from 'react-native-permissions';
import CameraIcon from '@assets/svgs/Camera.svg';
import ImageIcon from '@assets/svgs/Image.svg';
import MapIcon from '@assets/svgs/Map.svg';

export const Onboarding3Screen = () => {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();
  const {
    cameraPermission,
    photoLibraryPermission,
    locationPermission,
    requestAllPermissions,
  } = usePermissionStore();

  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermissions = useCallback(async () => {
    setIsRequesting(true);
    const result = await requestAllPermissions();
    setIsRequesting(false);
    
    if (result) {
      // 모든 권한이 허용된 경우 온보딩 종료
      await completeOnboarding();
    } else {
      // 실패한 권한이 있는 경우 설정으로 가라는 긍정적인 alert 표시
      const storeState = usePermissionStore.getState();
      const failedPermissions: string[] = [];
      if (!storeState.cameraPermission) failedPermissions.push(t('screen3.permissions.camera.title', { ns: 'onboarding' }));
      if (!storeState.photoLibraryPermission) failedPermissions.push(t('screen3.permissions.photoLibrary.title', { ns: 'onboarding' }));
      if (!storeState.locationPermission) failedPermissions.push(t('screen3.permissions.location.title', { ns: 'onboarding' }));
      
      Alert.alert(
        t('screen3.alert.title', { ns: 'onboarding' }),
        t('screen3.alert.message', { ns: 'onboarding', permissions: failedPermissions.join(', ') }),
        [
          { text: t('screen3.alert.later', { ns: 'onboarding' }), style: 'cancel' },
          {
            text: t('screen3.alert.goToSettings', { ns: 'onboarding' }),
            onPress: () => {
              openSettings().catch(() => {});
            },
          },
        ]
      );
    }
  }, [requestAllPermissions, completeOnboarding]);

  const handleSkip = useCallback(async () => {
    // 나중에 하기 버튼 클릭 시 온보딩 완료
    await completeOnboarding();
  }, [completeOnboarding]);

  return (
    <Background isStatusBarGap={true} isTabBarGap={false}>
      <View className="flex-1 px-6 py-6 justify-between bg-[#EFEFEF]">
        {/* 제목 영역 */}
        <View className="mt-8 w-full">
          <Text
            text={t('screen3.title', { ns: 'onboarding' })}
            type="title2"
            className="text-left text-black font-bold mb-2"
          />
          <Text
            text={t('screen3.subtitle', { ns: 'onboarding' })}
            type="body3"
            className="text-left text-text-2"
          />
        </View>

        {/* 권한 리스트 카드 */}
        <View className="px-5 flex-1 justify-center">
          <PermissionRow
            title={t('screen3.permissions.camera.title', { ns: 'onboarding' })}
            description={t('screen3.permissions.camera.description', { ns: 'onboarding' })}
            granted={cameraPermission}
            Icon={CameraIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title={t('screen3.permissions.photoLibrary.title', { ns: 'onboarding' })}
            description={t('screen3.permissions.photoLibrary.description', { ns: 'onboarding' })}
            granted={photoLibraryPermission}
            Icon={ImageIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title={t('screen3.permissions.location.title', { ns: 'onboarding' })}
            description={t('screen3.permissions.location.description', { ns: 'onboarding' })}
            granted={locationPermission}
            Icon={MapIcon}
          />
        </View>

        {/* 권한 획득 버튼 */}
        <View className="pb-2 gap-2">
          <TouchableOpacity
            onPress={handleRequestPermissions}
            disabled={isRequesting}
            className="w-full h-14 bg-white rounded-3xl items-center justify-center"
            style={{ opacity: isRequesting ? 0.5 : 1 }}
          >
            {isRequesting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text
                text={t('screen3.button', { ns: 'onboarding' })}
                type="body1"
                className="text-black font-bold"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text text={t('screen3.skip', { ns: 'onboarding' })} type="caption1" className="text-text-2 text-center" />
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
};