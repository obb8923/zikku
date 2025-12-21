import { supabase } from './supabase';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base64-arraybuffer';

export interface CreateRecordData {
  user_id: string;
  latitude: number;
  longitude: number;
  image_path: string;
  category: string;
  memo?: string;
  created_at?: string;
}

export interface ImageData {
  uri: string;
  fileName?: string;
  type?: string;
  width?: number;
  height?: number;
}

/**
 * 이미지를 Supabase Storage에 업로드합니다.
 * @param imageData 이미지 데이터 (uri, fileName, type 등)
 * @param userId 사용자 ID
 * @returns 업로드된 이미지의 public URL
 */
export async function uploadImageToStorage(
  imageData: ImageData,
  userId: string,
): Promise<string> {
  console.log('[uploadImageToStorage] 시작');
  console.log('[uploadImageToStorage] 입력:', {
    uri: imageData.uri,
    fileName: imageData.fileName,
    type: imageData.type,
    userId,
  });
  
  try {
    const { uri, fileName: originalFileName, type } = imageData;
    
    // 파일 확장자 추출 (전달받은 fileName 또는 type 우선 사용)
    console.log('[uploadImageToStorage] 파일 확장자 추출 시작');
    let fileExtension = 'jpg';
    if (originalFileName) {
      const fileNameParts = originalFileName.split('.');
      if (fileNameParts.length > 1) {
        fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
      }
      console.log('[uploadImageToStorage] fileName에서 확장자 추출:', fileExtension);
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
      console.log('[uploadImageToStorage] type에서 확장자 추출:', fileExtension, 'from', type);
    } else {
      // uri에서 확장자 추출 (fallback)
      const uriParts = uri.split('.');
      fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      console.log('[uploadImageToStorage] uri에서 확장자 추출:', fileExtension);
    }
    
    // 파일명 생성: userId/timestamp_randomString.extension
    console.log('[uploadImageToStorage] 파일명 생성 시작');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Storage 경로: {user_id}/{fileName}
    const filePath = `${userId}/${fileName}`;
    console.log('[uploadImageToStorage] 생성된 파일 경로:', filePath);
    
    // React Native에서 파일 읽기 및 업로드
    console.log('[uploadImageToStorage] 파일 읽기 시작, Platform:', Platform.OS);
    let arrayBuffer: ArrayBuffer;
    
    if (Platform.OS === 'web') {
      console.log('[uploadImageToStorage] Web 환경: fetch로 파일 읽기');
      // Web 환경에서는 fetch로 Blob 가져오기
      const response = await fetch(uri);
      const blob = await response.blob();
      arrayBuffer = await (blob as any).arrayBuffer();
      console.log('[uploadImageToStorage] Web: ArrayBuffer 크기:', arrayBuffer.byteLength);
    } else {
      // React Native: RNFS.readFile()로 Base64 읽기
      let base64String: string;
      
      if (uri.startsWith('content://')) {
        console.log('[uploadImageToStorage] Android content:// URI 처리');
        // Android content:// URI는 fetch로 읽어서 base64로 변환
        // react-native-image-picker의 경우 content:// URI를 사용할 수 있음
        // 이 경우 RNFS가 아닌 다른 방법 필요
        // 일단 file:// 경로로 변환 시도하거나, fetch 사용
        try {
          console.log('[uploadImageToStorage] content:// URI: fetch로 읽기 시도');
          // content:// URI를 직접 읽을 수 없으므로 fetch 사용
          const response = await fetch(uri);
          const blob = await response.blob();
          console.log('[uploadImageToStorage] content:// URI: Blob 크기:', blob.size);
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
          console.log('[uploadImageToStorage] content:// URI: Base64 변환 완료, 길이:', base64String.length);
          arrayBuffer = decodeBase64(base64String);
          console.log('[uploadImageToStorage] content:// URI: ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
        } catch (error) {
          console.log('[uploadImageToStorage] content:// URI fetch 실패, RNFS 시도:', error);
          // fetch 실패 시 RNFS 시도 (일부 경우 작동할 수 있음)
          base64String = await RNFS.readFile(uri, 'base64');
          console.log('[uploadImageToStorage] content:// URI: RNFS로 Base64 읽기 완료, 길이:', base64String.length);
          arrayBuffer = decodeBase64(base64String);
          console.log('[uploadImageToStorage] content:// URI: ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
        }
      } else {
        // file:// URI는 RNFS로 직접 읽기
        console.log('[uploadImageToStorage] file:// URI 처리');
        const filePath = uri.replace('file://', '');
        console.log('[uploadImageToStorage] 파일 경로:', filePath);
        base64String = await RNFS.readFile(filePath, 'base64');
        console.log('[uploadImageToStorage] Base64 읽기 완료, 길이:', base64String.length);
        // Base64를 ArrayBuffer로 변환
        arrayBuffer = decodeBase64(base64String);
        console.log('[uploadImageToStorage] ArrayBuffer 변환 완료, 크기:', arrayBuffer.byteLength);
      }
    }
    
    // Supabase Storage에 업로드
    console.log('[uploadImageToStorage] Supabase Storage 업로드 시작');
    console.log('[uploadImageToStorage] 업로드 파라미터:', {
      filePath,
      contentType: `image/${fileExtension}`,
      arrayBufferSize: arrayBuffer.byteLength,
    });
    
    // ArrayBuffer와 메타데이터(contentType, cacheControl) 함께 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false,
      });
    
    console.log('[uploadImageToStorage] Supabase Storage 업로드 응답:', {
      data: data ? '성공' : 'null',
      error: error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : null,
    });
    
    if (error) {
      console.error('[uploadImageToStorage] 업로드 실패 상세:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: JSON.stringify(error),
      });
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
    
    console.log('[uploadImageToStorage] 업로드 성공, Public URL 가져오기');
    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    console.log('[uploadImageToStorage] Public URL:', urlData.publicUrl);
    console.log('[uploadImageToStorage] 완료');
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
}

/**
 * 레코드를 Supabase에 저장합니다.
 * @param recordData 레코드 데이터
 * @returns 저장된 레코드 데이터
 */
export async function createRecord(
  recordData: CreateRecordData,
): Promise<any> {
  console.log('[createRecord] 시작');
  console.log('[createRecord] 입력 데이터:', {
    user_id: recordData.user_id,
    latitude: recordData.latitude,
    longitude: recordData.longitude,
    image_path: recordData.image_path,
    category: recordData.category,
    memo: recordData.memo || null,
    created_at: recordData.created_at || new Date().toISOString(),
  });
  
  try {
    console.log('[createRecord] Supabase insert 시작');
    const { data, error } = await supabase
      .from('records')
      .insert({
        user_id: recordData.user_id,
        latitude: recordData.latitude,
        longitude: recordData.longitude,
        image_path: recordData.image_path,
        category: recordData.category,
        memo: recordData.memo || null,
        created_at: recordData.created_at || new Date().toISOString(),
      })
      .select()
      .single();
    
    console.log('[createRecord] Supabase insert 응답:', {
      data: data ? '성공' : 'null',
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      } : null,
    });
    
    if (error) {
      console.error('[createRecord] 저장 실패 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`레코드 저장 실패: ${error.message}`);
    }
    
    console.log('[createRecord] 저장 성공:', data);
    console.log('[createRecord] 완료');
    return data;
  } catch (error: any) {
    console.error('레코드 저장 오류:', error);
    throw error;
  }
}

/**
 * 이미지 업로드 및 레코드 저장을 한 번에 처리합니다.
 * @param imageData 이미지 데이터 (uri, fileName, type 등)
 * @param userId 사용자 ID
 * @param latitude 위도
 * @param longitude 경도
 * @param category 카테고리
 * @param memo 메모 (선택)
 * @returns 저장된 레코드 데이터
 */
export async function saveRecord(
  imageData: ImageData,
  userId: string,
  latitude: number,
  longitude: number,
  category: string,
  memo?: string,
): Promise<any> {
  console.log('[saveRecord] 전체 프로세스 시작');
  console.log('[saveRecord] 입력:', {
    userId,
    latitude,
    longitude,
    category,
    memo,
    imageUri: imageData.uri,
  });
  
  try {
    // 1. 이미지 업로드
    console.log('[saveRecord] 1단계: 이미지 업로드 시작');
    const imagePath = await uploadImageToStorage(imageData, userId);
    console.log('[saveRecord] 1단계 완료: 이미지 업로드 성공, 경로:', imagePath);
    
    // 2. 레코드 저장
    console.log('[saveRecord] 2단계: 레코드 저장 시작');
    const record = await createRecord({
      user_id: userId,
      latitude,
      longitude,
      image_path: imagePath,
      category,
      memo,
    });
    console.log('[saveRecord] 2단계 완료: 레코드 저장 성공');
    
    console.log('[saveRecord] 전체 프로세스 완료');
    return record;
  } catch (error: any) {
    console.error('레코드 저장 전체 프로세스 오류:', error);
    throw error;
  }
}

export const RecordService = {
  uploadImageToStorage,
  createRecord,
  saveRecord,
};

