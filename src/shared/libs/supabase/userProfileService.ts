import { supabase } from './supabase';

export interface UserProfile {
  email?: string;
  name?: string;
  avatar_url?: string;
  code?: string;
}

/**
 * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 * @returns 사용자 프로필 정보 또는 null (에러 발생 시)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      return null;
    }

    if (!user) {
      return null;
    }

    // user_metadata에서 code 확인
    let userCode = user.user_metadata?.code;
    
    // user_metadata에 code가 없으면 profiles 테이블에서 가져오기 시도
    if (!userCode) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('code')
          .eq('id', user.id)
          .single();
        
        if (!profileError && profile?.code) {
          userCode = profile.code;
        }
      } catch (err) {
        // profiles 테이블이 없거나 에러가 발생해도 계속 진행
        console.log('프로필 테이블에서 코드 조회 실패:', err);
      }
    }

    return {
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      code: userCode,
    };
  } catch (error) {
    console.error('프로필 로드 오류:', error);
    return null;
  }
}

export const UserProfileService = {
  getUserProfile,
};

export default UserProfileService;

