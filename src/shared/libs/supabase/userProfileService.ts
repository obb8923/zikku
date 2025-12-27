import { supabase } from './supabase';

export interface UserProfile {
  email?: string;
  name?: string;
  nickname?: string;
  avatar_url?: string;
  code?: string;
  age?: number;
  gender?: string;
  birthday?: string;
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

    // public.users 테이블에서 프로필 정보 가져오기 (필요한 필드만)
    let profileData: Partial<UserProfile> = {};
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('nickname, avatar_url, code')
        .eq('id', user.id)
        .maybeSingle(); // .single() 대신 .maybeSingle() 사용 (레코드가 없어도 에러 발생 안 함)
      
      if (profileError) {
        console.error('users 테이블 조회 오류:', profileError);
      }
      
      // profile이 존재하면 데이터 설정
      if (profile) {
        profileData = {
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
          code: profile.code,
        };
        console.log('[getUserProfile] users 테이블에서 데이터 가져오기 성공:', { 
          code: profile.code, 
          nickname: profile.nickname,
          hasCode: !!profile.code 
        });
      } else {
        console.log('[getUserProfile] users 테이블에 레코드가 없습니다.');
      }
    } catch (err) {
      // users 테이블이 없거나 에러가 발생해도 계속 진행
      console.error('[getUserProfile] users 테이블에서 정보 조회 실패:', err);
    }

    // users 테이블에서 가져온 데이터 반환 (code는 users 테이블에서만 가져오기)
    const result = {
      nickname: profileData.nickname,
      avatar_url: profileData.avatar_url,
      code: profileData.code,
    };
    
    console.log('[getUserProfile] 최종 반환값:', { 
      hasCode: !!result.code, 
      code: result.code,
      nickname: result.nickname 
    });
    
    return result;
  } catch (error) {
    console.error('프로필 로드 오류:', error);
    return null;
  }
}

/**
 * 사용자 프로필 정보를 업데이트합니다.
 * @param profile 업데이트할 프로필 정보
 * @returns 성공 여부
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('사용자 정보 가져오기 오류:', userError);
      return false;
    }

    // public.users 테이블에 업데이트 또는 삽입 (필요한 필드만)
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
      }, {
        onConflict: 'id',
      });

    if (upsertError) {
      console.error('프로필 업데이트 오류:', upsertError);
      return false;
    }

    // user_metadata도 업데이트 (선택적)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
      },
    });

    if (updateError) {
      console.error('사용자 메타데이터 업데이트 오류:', updateError);
      // users 테이블 업데이트는 성공했으므로 true 반환
    }

    return true;
  } catch (error) {
    console.error('프로필 업데이트 중 오류:', error);
    return false;
  }
}

export const UserProfileService = {
  getUserProfile,
  updateUserProfile,
};

export default UserProfileService;

