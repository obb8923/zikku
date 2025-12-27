import { supabase } from './supabase';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base64-arraybuffer';

export interface ImageData {
  uri: string;
  fileName?: string;
  type?: string;
  width?: number;
  height?: number;
}

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

    // public.users 테이블에 업데이트 또는 삽입 (email 필수 포함)
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email, // email 필드 추가 (NOT NULL 제약조건 충족)
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

/**
 * 아바타 이미지를 Supabase Storage에 업로드합니다.
 * @param imageData 이미지 데이터
 * @returns 업로드된 이미지의 public URL
 */
export async function uploadAvatarImage(imageData: ImageData): Promise<string> {
  console.log('[uploadAvatarImage] 시작');
  console.log('[uploadAvatarImage] 입력:', {
    uri: imageData.uri,
    fileName: imageData.fileName,
    type: imageData.type,
  });
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[uploadAvatarImage] 사용자 정보 가져오기 실패:', userError);
      throw new Error('사용자 정보를 가져올 수 없습니다.');
    }

    const userId = user.id;
    const { uri, fileName: originalFileName, type } = imageData;
    
    // 파일 확장자 추출 (전달받은 fileName 또는 type 우선 사용)
    console.log('[uploadAvatarImage] 파일 확장자 추출 시작');
    let fileExtension = 'jpg';
    if (originalFileName) {
      const fileNameParts = originalFileName.split('.');
      if (fileNameParts.length > 1) {
        fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
      }
      console.log('[uploadAvatarImage] fileName에서 확장자 추출:', fileExtension);
    } else if (type) {
      // type에서 확장자 추출 (예: "image/jpeg" -> "jpg")
      const typeMap: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      fileExtension = typeMap[type.toLowerCase()] || 'jpg';
      console.log('[uploadAvatarImage] type에서 확장자 추출:', fileExtension, 'from', type);
    } else {
      // uri에서 확장자 추출 (fallback)
      const uriParts = uri.split('.');
      fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      console.log('[uploadAvatarImage] uri에서 확장자 추출:', fileExtension);
    }
    
    // 파일명: avatar_url.extension
    const fileName = `avatar_url.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    console.log('[uploadAvatarImage] 생성된 파일 경로:', filePath);
    
    // 기존 avatar_url 파일 삭제 (확장자 무관)
    console.log('[uploadAvatarImage] 기존 아바타 파일 삭제 시작');
    try {
      const { data: existingFiles } = await supabase.storage
        .from('images')
        .list(userId);
      
      if (existingFiles && existingFiles.length > 0) {
        // avatar_url로 시작하는 파일 찾기
        const avatarFiles = existingFiles.filter(file => 
          file.name.startsWith('avatar_url.')
        );
        
        if (avatarFiles.length > 0) {
          const filesToDelete = avatarFiles.map(file => `${userId}/${file.name}`);
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove(filesToDelete);
          
          if (deleteError) {
            console.log('[uploadAvatarImage] 기존 파일 삭제 실패 (무시):', deleteError);
          } else {
            console.log('[uploadAvatarImage] 기존 아바타 파일 삭제 완료:', filesToDelete);
          }
        } else {
          console.log('[uploadAvatarImage] 삭제할 기존 아바타 파일 없음');
        }
      } else {
        console.log('[uploadAvatarImage] 사용자 폴더에 파일 없음');
      }
    } catch (deleteError) {
      console.log('[uploadAvatarImage] 기존 파일 삭제 중 오류 발생 (무시):', deleteError);
    }
    
    // React Native에서 파일 읽기 및 업로드
    console.log('[uploadAvatarImage] 파일 읽기 시작, Platform:', Platform.OS);
    let arrayBuffer: ArrayBuffer;
    
    if (Platform.OS === 'web') {
      console.log('[uploadAvatarImage] Web 환경: fetch로 파일 읽기');
      // Web 환경에서는 fetch로 Blob 가져오기
      const response = await fetch(uri);
      const blob = await response.blob();
      arrayBuffer = await (blob as any).arrayBuffer();
      console.log('[uploadAvatarImage] Web: ArrayBuffer 크기:', arrayBuffer.byteLength);
    } else {
      // React Native: RNFS.readFile()로 Base64 읽기
      let base64String: string;
      
      if (uri.startsWith('content://')) {
        console.log('[uploadAvatarImage] Android content:// URI 처리');
        // Android content:// URI는 fetch로 읽어서 base64로 변환
        try {
          console.log('[uploadAvatarImage] content:// URI: fetch로 읽기 시도');
          const response = await fetch(uri);
          const blob = await response.blob();
          console.log('[uploadAvatarImage] content:// URI: Blob 크기:', blob.size);
          // React Native에서 blob.arrayBuffer()가 지원되지 않을 수 있으므로
          // Base64로 변환 후 ArrayBuffer로 변환
          const reader = new FileReader();
          base64String = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                // data:image/...;base64, 부분 제거
                const base64 = reader.result.split(',')[1] || reader.result;
                resolve(base64);
              } else {
                reject(new Error('Failed to convert blob to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log('[uploadAvatarImage] content:// URI: Base64 변환 완료, 길이:', base64String.length);
          arrayBuffer = decodeBase64(base64String);
          console.log('[uploadAvatarImage] content:// URI: ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
        } catch (error) {
          console.log('[uploadAvatarImage] content:// URI fetch 실패, RNFS 시도:', error);
          // fetch 실패 시 RNFS 시도 (일부 경우 작동할 수 있음)
          base64String = await RNFS.readFile(uri, 'base64');
          console.log('[uploadAvatarImage] content:// URI: RNFS로 Base64 읽기 완료, 길이:', base64String.length);
          arrayBuffer = decodeBase64(base64String);
          console.log('[uploadAvatarImage] content:// URI: ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
        }
      } else {
        // file:// URI는 RNFS로 직접 읽기
        console.log('[uploadAvatarImage] file:// URI 처리');
        const filePath = uri.replace('file://', '');
        console.log('[uploadAvatarImage] 파일 경로:', filePath);
        base64String = await RNFS.readFile(filePath, 'base64');
        console.log('[uploadAvatarImage] Base64 읽기 완료, 길이:', base64String.length);
        // Base64를 ArrayBuffer로 변환
        arrayBuffer = decodeBase64(base64String);
        console.log('[uploadAvatarImage] ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
      }
    }
    
    // Supabase Storage에 업로드
    console.log('[uploadAvatarImage] Supabase Storage 업로드 시작');
    console.log('[uploadAvatarImage] 업로드 파라미터:', {
      filePath,
      contentType: `image/${fileExtension}`,
      arrayBufferSize: arrayBuffer.byteLength,
    });
    
    // ArrayBuffer와 메타데이터(contentType, cacheControl) 함께 업로드
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false, // 기존 파일은 이미 삭제했으므로 upsert 불필요
      });
    
    console.log('[uploadAvatarImage] Supabase Storage 업로드 응답:', {
      data: data ? '성공' : 'null',
      error: uploadError ? {
        message: uploadError.message,
        name: uploadError.name,
        stack: uploadError.stack,
      } : null,
    });
    
    if (uploadError) {
      console.error('[uploadAvatarImage] 업로드 실패 상세:', {
        message: uploadError.message,
        name: uploadError.name,
        stack: uploadError.stack,
        error: JSON.stringify(uploadError),
      });
      throw new Error(`아바타 업로드 실패: ${uploadError.message}`);
    }
    
    console.log('[uploadAvatarImage] 업로드 성공, Public URL 가져오기');
    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    console.log('[uploadAvatarImage] Public URL:', urlData.publicUrl);
    console.log('[uploadAvatarImage] 완료');
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('[uploadAvatarImage] 아바타 업로드 오류:', error);
    throw error;
  }
}

export const UserProfileService = {
  getUserProfile,
  updateUserProfile,
  uploadAvatarImage,
};

export default UserProfileService;

