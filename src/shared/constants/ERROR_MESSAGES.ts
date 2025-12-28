/**
 * 공통 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  // 일반 오류
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  LOGIN_REQUIRED: '로그인이 필요합니다.',
  
  // 로그인 관련
  LOGIN_ERROR: '로그인 중 오류가 발생했습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  TOO_MANY_ATTEMPTS: '로그인 시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  INVALID_AUTH_INFO: '인증 정보가 올바르지 않습니다.',
  AUTH_INFO_NOT_RECEIVED: '인증 정보를 받지 못했습니다.',
  ID_TOKEN_NOT_RECEIVED: 'idToken을 받아오지 못했습니다.',
  
  // 기록 관련
  RECORD_SAVE_FAILED: '기록 저장에 실패했습니다.',
  RECORD_UPDATE_FAILED: '기록 수정에 실패했습니다.',
  RECORD_DELETE_FAILED: '기록 삭제에 실패했습니다.',
  RECORD_NOT_FOUND: '기록를 찾을 수 없습니다.',
  RECORD_FETCH_FAILED: '기록 조회에 실패했습니다.',
  
  // 프로필 관련
  PROFILE_UPDATE_FAILED: '프로필 업데이트에 실패했습니다.',
  PROFILE_NOT_FOUND: '사용자 정보를 불러올 수 없습니다.',
  
  // 권한 관련
  PERMISSION_REQUIRED: '권한이 필요합니다.',
  PHOTO_LIBRARY_PERMISSION_REQUIRED: '사진을 선택하려면 갤러리 접근 권한이 필요합니다.',
  
  // 유효성 검사
  CATEGORY_REQUIRED: '카테고리를 선택해주세요.',
  LOCATION_REQUIRED: '위치를 선택해주세요.',
  IMAGE_REQUIRED: '이미지가 필요합니다.',
  NICKNAME_REQUIRED: '닉네임을 입력해주세요.',
  REQUIRED_INFO_MISSING: '필수 정보가 누락되었습니다.',
  
  // 기타
  EMAIL_APP_CANNOT_OPEN: '이메일 앱을 열 수 없습니다.',
  LINK_CANNOT_OPEN: '링크를 열 수 없습니다.',
  STORE_CANNOT_OPEN: '스토어를 열 수 없습니다.',
} as const;

