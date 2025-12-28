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
  try {
    const { uri, fileName: originalFileName, type } = imageData;
    
    // 파일 확장자 추출 (전달받은 fileName 또는 type 우선 사용)
    let fileExtension = 'jpg';
    if (originalFileName) {
      const fileNameParts = originalFileName.split('.');
      if (fileNameParts.length > 1) {
        fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
      }
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
    } else {
      // uri에서 확장자 추출 (fallback)
      const uriParts = uri.split('.');
      fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
    }
    
    // 파일명 생성: userId/timestamp_randomString.extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // Storage 경로: {user_id}/{fileName}
    const filePath = `${userId}/${fileName}`;
    
    // React Native에서 파일 읽기 및 업로드
    let arrayBuffer: ArrayBuffer;
    
    if (Platform.OS === 'web') {
      // Web 환경에서는 fetch로 Blob 가져오기
      const response = await fetch(uri);
      const blob = await response.blob();
      arrayBuffer = await (blob as any).arrayBuffer();
    } else {
      // React Native: RNFS.readFile()로 Base64 읽기
      let base64String: string;
      
      if (uri.startsWith('content://')) {
        // Android content:// URI는 fetch로 읽어서 base64로 변환
        try {
          // content:// URI를 직접 읽을 수 없으므로 fetch 사용
          const response = await fetch(uri);
          const blob = await response.blob();
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
          arrayBuffer = decodeBase64(base64String);
        } catch (error) {
          // fetch 실패 시 RNFS 시도 (일부 경우 작동할 수 있음)
          base64String = await RNFS.readFile(uri, 'base64');
          arrayBuffer = decodeBase64(base64String);
        }
      } else {
        // file:// URI는 RNFS로 직접 읽기
        const filePath = uri.replace('file://', '');
        base64String = await RNFS.readFile(filePath, 'base64');
        // Base64를 ArrayBuffer로 변환
        arrayBuffer = decodeBase64(base64String);
      }
    }
    
    // Supabase Storage에 업로드
    
    // ArrayBuffer와 메타데이터(contentType, cacheControl) 함께 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
    
    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error: any) {
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
  try {
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
    
    if (error) {
      throw new Error(`레코드 저장 실패: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
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
  try {
    // 1. 이미지 업로드
    const imagePath = await uploadImageToStorage(imageData, userId);
    
    // 2. 레코드 저장
    const record = await createRecord({
      user_id: userId,
      latitude,
      longitude,
      image_path: imagePath,
      category,
      memo,
    });
    
    return record;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 레코드를 Supabase에서 업데이트합니다.
 * @param recordId 레코드 ID
 * @param updateData 업데이트할 데이터
 * @returns 업데이트된 레코드 데이터
 */
export async function updateRecord(
  recordId: string,
  updateData: {
    latitude?: number;
    longitude?: number;
    category?: string;
    memo?: string | null;
  },
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`레코드 업데이트 실패: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 레코드를 Supabase에서 삭제합니다.
 * @param recordId 레코드 ID
 * @returns 삭제 성공 여부
 */
export async function deleteRecord(recordId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', recordId);
    
    if (error) {
      throw new Error(`레코드 삭제 실패: ${error.message}`);
    }
  } catch (error: any) {
    throw error;
  }
}

export const RecordService = {
  uploadImageToStorage,
  createRecord,
  saveRecord,
  updateRecord,
  deleteRecord,
};

