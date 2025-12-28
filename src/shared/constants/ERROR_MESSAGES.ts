/**
 * 공통 에러 메시지 상수
 * i18n 키를 사용하여 다국어 지원
 * 실제 사용 시에는 useTranslation hook이나 translate 함수를 사용하세요
 */
export const ERROR_MESSAGES = {
  // 일반 오류
  UNKNOWN_ERROR: 'unknownError',
  LOGIN_REQUIRED: 'loginRequired',
  
  // 로그인 관련
  LOGIN_ERROR: 'loginError',
  INVALID_CREDENTIALS: 'invalidCredentials',
  TOO_MANY_ATTEMPTS: 'tooManyAttempts',
  SERVER_ERROR: 'serverError',
  INVALID_AUTH_INFO: 'invalidAuthInfo',
  AUTH_INFO_NOT_RECEIVED: 'authInfoNotReceived',
  ID_TOKEN_NOT_RECEIVED: 'idTokenNotReceived',
  
  // 기록 관련
  RECORD_SAVE_FAILED: 'recordSaveFailed',
  RECORD_UPDATE_FAILED: 'recordUpdateFailed',
  RECORD_DELETE_FAILED: 'recordDeleteFailed',
  RECORD_NOT_FOUND: 'recordNotFound',
  RECORD_FETCH_FAILED: 'recordFetchFailed',
  
  // 프로필 관련
  PROFILE_UPDATE_FAILED: 'profileUpdateFailed',
  PROFILE_NOT_FOUND: 'profileNotFound',
  
  // 권한 관련
  PERMISSION_REQUIRED: 'permissionRequired',
  PHOTO_LIBRARY_PERMISSION_REQUIRED: 'photoLibraryPermissionRequired',
  
  // 유효성 검사
  CATEGORY_REQUIRED: 'categoryRequired',
  LOCATION_REQUIRED: 'locationRequired',
  IMAGE_REQUIRED: 'imageRequired',
  NICKNAME_REQUIRED: 'nicknameRequired',
  REQUIRED_INFO_MISSING: 'requiredInfoMissing',
  
  // 기타
  EMAIL_APP_CANNOT_OPEN: 'emailAppCannotOpen',
  LINK_CANNOT_OPEN: 'linkCannotOpen',
  STORE_CANNOT_OPEN: 'storeCannotOpen',
} as const;

