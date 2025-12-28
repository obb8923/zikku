import { supabase } from './supabase';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import ImageResizer from '@bam.tech/react-native-image-resizer';

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

// 이미지 최적화 설정
const MAX_IMAGE_WIDTH = 800; // 최대 너비 (픽셀) - 아바타(400px)보다 크게, 하지만 DB 부담 최소화
const MAX_IMAGE_HEIGHT = 800; // 최대 높이 (픽셀)
const JPEG_QUALITY = 85; // JPEG 품질 (0-100, 85는 시각적 차이 없으면서 크기 감소)

/**
 * 이미지를 리사이징하고 압축합니다.
 * @param imageData 원본 이미지 데이터
 * @returns 최적화된 이미지 URI
 */
async function optimizeImage(imageData: ImageData): Promise<string> {
  const { uri, width: originalWidth, height: originalHeight } = imageData;

  // 원본 크기 정보가 있고 최대 크기보다 작으면 리사이징 불필요
  // (크기 정보가 없으면 리사이징 시도하여 최적화 보장)
  if (
    originalWidth &&
    originalHeight &&
    originalWidth <= MAX_IMAGE_WIDTH &&
    originalHeight <= MAX_IMAGE_HEIGHT
  ) {
    // 크기는 적절하지만 JPEG 압축은 적용 (PNG 등 다른 형식일 수 있음)
    // React Native에서는 ImageResizer로 형식 변환 및 압축
    if (Platform.OS !== 'web') {
      try {
        const resizedImage = await ImageResizer.createResizedImage(
          uri,
          originalWidth,
          originalHeight,
          'JPEG',
          JPEG_QUALITY,
          0,
          undefined,
          false,
        );
        return resizedImage.uri;
      } catch (error) {
        console.warn('이미지 압축 실패, 원본 사용:', error);
        return uri;
      }
    }
    return uri;
  }

  try {
    if (Platform.OS === 'web') {
      // Web 환경에서는 Canvas API 사용
      return await optimizeImageWeb(uri, originalWidth, originalHeight);
    } else {
      // React Native 환경에서는 ImageResizer 사용
      // onlyScaleDown: true로 설정하여 작은 이미지는 확대하지 않음
      const resizedImage = await ImageResizer.createResizedImage(
        uri,
        MAX_IMAGE_WIDTH,
        MAX_IMAGE_HEIGHT,
        'JPEG',
        JPEG_QUALITY,
        0, // rotation
        undefined, // outputPath (임시 파일 사용)
        false, // keepMeta
        {
          mode: 'contain', // 비율 유지
          onlyScaleDown: true, // 확대하지 않고 축소만
        },
      );

      return resizedImage.uri;
    }
  } catch (error) {
    // 리사이징 실패 시 원본 반환
    console.warn('이미지 리사이징 실패, 원본 사용:', error);
    return uri;
  }
}

/**
 * Web 환경에서 Canvas API를 사용한 이미지 최적화
 */
async function optimizeImageWeb(
  uri: string,
  originalWidth?: number,
  originalHeight?: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Web 환경에서만 사용되는 DOM API
    // @ts-ignore - Web 환경에서만 실행되므로 DOM 타입 사용
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // @ts-ignore - Web 환경에서만 실행되므로 DOM 타입 사용
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // 비율 유지하면서 최대 크기로 조정
      if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        const ratio = Math.min(
          MAX_IMAGE_WIDTH / width,
          MAX_IMAGE_HEIGHT / height,
        );
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 압축 (품질 85%)
      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) {
            reject(new Error('이미지 압축 실패'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        JPEG_QUALITY / 100,
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };

    img.src = uri;
  });
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
    // 이미지 최적화 (리사이징 및 압축)
    const optimizedUri = await optimizeImage(imageData);
    
    // 최적화 후 항상 JPEG로 저장 (크기 최적화)
    const fileExtension = 'jpg';
    
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
      const response = await fetch(optimizedUri);
      const blob = await response.blob();
      arrayBuffer = await (blob as any).arrayBuffer();
    } else {
      // React Native: RNFS.readFile()로 Base64 읽기
      let base64String: string;
      
      if (optimizedUri.startsWith('content://')) {
        // Android content:// URI는 fetch로 읽어서 base64로 변환
        try {
          // content:// URI를 직접 읽을 수 없으므로 fetch 사용
          const response = await fetch(optimizedUri);
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
          base64String = await RNFS.readFile(optimizedUri, 'base64');
          arrayBuffer = decodeBase64(base64String);
        }
      } else if (optimizedUri.startsWith('data:')) {
        // data: URI (Web 최적화 결과)
        const base64 = optimizedUri.split(',')[1] || optimizedUri;
        arrayBuffer = decodeBase64(base64);
      } else {
        // file:// URI는 RNFS로 직접 읽기
        const filePath = optimizedUri.replace('file://', '');
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

