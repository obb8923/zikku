import { View, ScrollView, Alert, Image, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background, LiquidGlassTextButton, LiquidGlassInput } from '@components/index';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import { COLORS } from '@constants/COLORS';
import XIcon from '@assets/svgs/X.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { useEffect, useState, useRef } from 'react';
import { updateUserProfile, uploadAvatarImage, type UserProfile, type ImageData } from '@/shared/libs/supabase/userProfileService';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { usePermissionStore } from '@/shared/stores/permissionStore';

type MyInfoScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'MyInfo'>;

export const MyInfoScreen = () => {
  const navigation = useNavigation<MyInfoScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const userProfile = useAuthStore((s) => s.userProfile);
  const fetchUserProfile = useAuthStore((s) => s.fetchUserProfile);
  const userId = useAuthStore((s) => s.userId);
  const [isSaving, setIsSaving] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
  const [originalNickname, setOriginalNickname] = useState('');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [avatarUrlTimestamp, setAvatarUrlTimestamp] = useState<number>(Date.now());
  const nicknameInputRef = useRef<TextInput>(null);
  const requestPhotoLibraryPermission = usePermissionStore((s) => s.requestPhotoLibraryPermission);
  
  // 원본 상태 초기화
  useEffect(() => {
    if (userProfile) {
      const nickname = userProfile.nickname || '';
      const avatarUrl = userProfile.avatar_url || null;
      setNicknameValue(nickname);
      setOriginalNickname(nickname);
      // avatar_url이 변경된 경우에만 타임스탬프 업데이트
      if (originalAvatarUrl !== avatarUrl) {
        setAvatarUrlTimestamp(Date.now());
      }
      setOriginalAvatarUrl(avatarUrl);
      setSelectedAvatarUri(null); // 초기화 시 선택된 아바타 리셋
    }
  }, [userProfile, originalAvatarUrl]);
  
  // 변경사항 확인
  const hasChanges = 
    nicknameValue.trim() !== originalNickname || 
    selectedAvatarUri !== null;

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }

    if (!nicknameValue.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = originalAvatarUrl;

      // 아바타가 변경된 경우 업로드
      if (selectedAvatarUri) {
        const imageData: ImageData = {
          uri: selectedAvatarUri,
          fileName: 'avatar.jpg',
          type: 'image/jpeg',
        };
        avatarUrl = await uploadAvatarImage(imageData);
      }

      // 프로필 업데이트
      const success = await updateUserProfile({
        nickname: nicknameValue.trim(),
        avatar_url: avatarUrl || undefined,
      });

      if (success) {
        // 원본 상태를 먼저 업데이트
        setOriginalNickname(nicknameValue.trim());
        setOriginalAvatarUrl(avatarUrl);
        setSelectedAvatarUri(null);
        setAvatarUrlTimestamp(Date.now()); // 이미지 캐시 무효화를 위한 타임스탬프 업데이트
        // 프로필 다시 가져오기
        await fetchUserProfile();
        Alert.alert('성공', '프로필이 업데이트되었습니다.');
      } else {
        Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // 원본 상태로 복원
    setNicknameValue(originalNickname);
    setSelectedAvatarUri(null);
  };

  const handleAvatarPress = async () => {
    if (!userId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    // 권한 확인
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.5, // 아바타용으로 품질 낮춤 (0.5 = 50%)
        maxWidth: 400, // 최대 너비 400px로 제한
        maxHeight: 400, // 최대 높이 400px로 제한
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }

        // 아바타 선택 시 바로 업로드하지 않고, 로컬 URI만 저장
        setSelectedAvatarUri(asset.uri);
      }
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            const logout = useAuthStore.getState().logout;
            await logout();
            // 로그아웃 후 MapStack을 Map 화면으로 리셋 (모든 열려있는 스택 닫기)
            const parentNavigation = navigation.getParent();
            if (parentNavigation) {
              parentNavigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Map' }],
                })
              );
            } else {
              // parent가 없는 경우 직접 navigate
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Map' }],
                })
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 회원 탈퇴를 하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            const deleteAccount = useAuthStore.getState().deleteAccount;
            const success = await deleteAccount();
            if (success) {
              Alert.alert('완료', '회원 탈퇴가 완료되었습니다.');
              navigation.goBack();
            } else {
              Alert.alert('오류', '회원 탈퇴 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <Background isStatusBarGap={false}>
      <View className="pt-4 px-6 mb-4 flex-row justify-between items-center">
        <Text 
          type="title3" 
          text="내 정보" 
          style={{ fontWeight: '600', color: COLORS.TEXT_2, flex: 1 }} 
        />
        <LiquidGlassButton size="small" onPress={() => navigation.goBack()}>
          <XIcon width={20} height={20} color={COLORS.TEXT} />
        </LiquidGlassButton>
      </View>
      <ScrollView
        className="flex-1 px-8"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="w-full items-center justify-center gap-6">
          {userProfile ? (
            <View className="w-full gap-4">
              {/* 아바타 */}
              <View className="w-full items-center">
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                    {selectedAvatarUri ? (
                      <Image 
                        source={{ uri: selectedAvatarUri }} 
                        style={{ width: 96, height: 96 }}
                        resizeMode="cover"
                      />
                    ) : userProfile?.avatar_url ? (
                      <Image 
                        source={{ 
                          uri: `${userProfile.avatar_url}${userProfile.avatar_url.includes('?') ? '&' : '?'}t=${avatarUrlTimestamp}`
                        }} 
                        style={{ width: 96, height: 96 }}
                        resizeMode="cover"
                        key={`${userProfile.avatar_url}-${avatarUrlTimestamp}`}
                      />
                    ) : (
                      <Text type="title2" text={userProfile?.nickname?.charAt(0).toUpperCase() || 'U'} />
                    )}
                  </View>
                </TouchableOpacity>
                {selectedAvatarUri && (
                  <Text type="caption1" text="변경됨" className="mt-2 text-blue-500" />
                )}
              </View>

              {/* 닉네임 */}
              <View className="w-full gap-2">
                <Text type="body2" text="닉네임" className="text-gray-600" />
                <LiquidGlassInput
                  ref={nicknameInputRef}
                  value={nicknameValue}
                  onChangeText={setNicknameValue}
                  placeholder="닉네임을 입력하세요"
                  editable={!isSaving}
                />
              </View>

              {/* 저장/취소 버튼 */}
              {hasChanges && (
                <View className="w-full flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <LiquidGlassTextButton
                      text="취소"
                      onPress={handleCancel}
                      disabled={isSaving}
                      size="medium"
                      tintColor="rgba(255,255,255,0.2)"
                      textStyle={{ color: 'black', fontWeight: 'bold' }}
                    />
                  </View>
                  <View className="flex-1">
                    <LiquidGlassTextButton
                      text={isSaving ? '저장 중...' : '저장'}
                      onPress={handleSave}
                      disabled={isSaving || !hasChanges}
                      size="medium"
                      tintColor="white"
                      textStyle={{ color: 'black', fontWeight: 'bold' }}
                    />
                  </View>
                </View>
              )}

              {/* 사용자 코드 (읽기 전용) */}
              <View className="w-full gap-2">
                <Text type="body2" text="사용자 코드" className="text-gray-600" />
                <LiquidGlassInput
                  value={userProfile.code || '코드 없음'}
                  editable={false}
                  placeholder="코드 없음"
                />
              </View>

              {/* 로그아웃/회원 탈퇴 버튼 */}
              <View className="w-full gap-3 mt-6">
                <LiquidGlassTextButton
                  text="로그아웃"
                  onPress={handleLogout}
                  size="large"
                  tintColor="rgba(255,255,255,0.2)"
                  textStyle={{ color: 'black', fontWeight: 'bold' }}
                />
                <LiquidGlassTextButton
                  text="회원 탈퇴"
                  onPress={handleDeleteAccount}
                  size="large"
                  tintColor="rgba(255,0,0,0.1)"
                  textStyle={{ color: '#DC2626', fontWeight: 'bold' }}
                />
              </View>
            </View>
          ) : (
            <Text type="body1" text="사용자 정보를 불러올 수 없습니다." className="text-text-2"/>
          )}
        </View>
      </ScrollView>
    </Background>
  );
};

