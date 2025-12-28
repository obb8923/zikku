import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { Background, Text } from '@components/index';
import { useOnboarding } from '@hooks/useOnboarding';
import { usePermissionStore } from '@stores/permissionStore';
import { PermissionRow } from '@features/Onboarding/components/PermissionRow';
import { openSettings } from 'react-native-permissions';
import CameraIcon from '@assets/svgs/Camera.svg';
import ImageIcon from '@assets/svgs/Image.svg';
import MapIcon from '@assets/svgs/Map.svg';

export const Onboarding3Screen = () => {
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
      if (!storeState.cameraPermission) failedPermissions.push('카메라');
      if (!storeState.photoLibraryPermission) failedPermissions.push('라이브러리');
      if (!storeState.locationPermission) failedPermissions.push('위치');
      
      Alert.alert(
        '권한 설정이 필요해요',
        `더 나은 경험을 위해 ${failedPermissions.join(', ')} 권한을 허용해주세요.\n설정에서 권한을 변경할 수 있어요.`,
        [
          { text: '나중에', style: 'cancel' },
          {
            text: '설정으로 가기',
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
            text="권한을 허용해주세요"
            type="title2"
            className="text-left text-black font-bold mb-2"
          />
          <Text
            text="순간을기록하기 위해 다음 권한이 필요해요"
            type="body3"
            className="text-left text-text-2"
          />
        </View>

        {/* 권한 리스트 카드 */}
        <View className="px-5 flex-1 justify-center">
          <PermissionRow
            title="카메라"
            description="순간을 촬영하기 위해 필요해요"
            granted={cameraPermission}
            Icon={CameraIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title="사진 라이브러리"
            description="기록을 불러오기 위해 필요해요"
            granted={photoLibraryPermission}
            Icon={ImageIcon}
          />
          <View className="h-[1px] bg-gray-200 my-4" />
          <PermissionRow
            title="위치"
            description="위치를기록하기 위해 필요해요"
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
                text="권한 허용하기"
                type="body1"
                className="text-black font-bold"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text text="나중에 하기" type="caption1" className="text-text-2 text-center" />
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
};