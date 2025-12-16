/*
  AsyncStorageService: 앱 내 로컬 스토리지(AsyncStorage) 접근 유틸

  - 옵션
    - StorageOptions.prefix: 키 네임스페이스 프리픽스(기본 'FO_')

  - 문자열 API
    - setItem(key, value, options): 문자열 값 저장
    - getItem(key, options): 문자열 값 조회
    - removeItem(key, options): 키 삭제
    - mergeItem(key, value, options): 문자열(JSON 문자열 권장) 병합
    - clear(): 전체 스토리지 비우기(주의)
    - getAllKeys(): 모든 키 조회(ReadonlyArray)

  - 멀티 API
    - multiSet([[key, value], ...], options): 여러 키-값 일괄 저장
    - multiGet([key, ...], options): 여러 키 일괄 조회(ReadonlyArray)
    - multiRemove([key, ...], options): 여러 키 일괄 삭제

  - JSON 헬퍼
    - setJSONItem<T>(key, data, options): 객체를 JSON 문자열로 직렬화하여 저장
    - getJSONItem<T>(key, options): JSON 문자열을 역직렬화하여 반환(null 허용)
    - updateJSONItem<T>(key, updater, options): 현재 값을 불러와 변경 후 다시 저장
*/
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StorageKey = string;

type JsonValue = unknown;

export interface StorageOptions {
  prefix?: string;
}

const DEFAULT_PREFIX = 'FO_';

const buildKey = (key: StorageKey, options?: StorageOptions): string => {
  const prefix = options?.prefix ?? DEFAULT_PREFIX;
  return `${prefix}${key}`;
};

export async function setItem(
  key: StorageKey,
  value: string,
  options?: StorageOptions,
): Promise<void> {
  await AsyncStorage.setItem(buildKey(key, options), value);
}

export async function getItem(
  key: StorageKey,
  options?: StorageOptions,
): Promise<string | null> {
  return AsyncStorage.getItem(buildKey(key, options));
}

export async function removeItem(
  key: StorageKey,
  options?: StorageOptions,
): Promise<void> {
  await AsyncStorage.removeItem(buildKey(key, options));
}

export async function mergeItem(
  key: StorageKey,
  value: string,
  options?: StorageOptions,
): Promise<void> {
  await AsyncStorage.mergeItem(buildKey(key, options), value);
}

export async function clear(): Promise<void> {
  await AsyncStorage.clear();
}

export async function getAllKeys(): Promise<ReadonlyArray<string>> {
  return AsyncStorage.getAllKeys();
}

export async function multiSet(
  entries: Array<[StorageKey, string]>,
  options?: StorageOptions,
): Promise<void> {
  const mapped = entries.map(([k, v]) => [buildKey(k, options), v] as [string, string]);
  await AsyncStorage.multiSet(mapped);
}

export async function multiGet(
  keys: StorageKey[],
  options?: StorageOptions,
): Promise<ReadonlyArray<[string, string | null]>> {
  const mapped = keys.map((k) => buildKey(k, options));
  return AsyncStorage.multiGet(mapped);
}

export async function multiRemove(
  keys: StorageKey[],
  options?: StorageOptions,
): Promise<void> {
  const mapped = keys.map((k) => buildKey(k, options));
  await AsyncStorage.multiRemove(mapped);
}

export async function setJSONItem<T extends JsonValue>(
  key: StorageKey,
  value: T,
  options?: StorageOptions,
): Promise<void> {
  const serialized = JSON.stringify(value);
  await setItem(key, serialized, options);
}

export async function getJSONItem<T = unknown>(
  key: StorageKey,
  options?: StorageOptions,
): Promise<T | null> {
  const raw = await getItem(key, options);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function updateJSONItem<T extends Record<string, unknown>>(
  key: StorageKey,
  updater: (current: T | null) => T,
  options?: StorageOptions,
): Promise<T> {
  const current = await getJSONItem<T>(key, options);
  const next = updater(current);
  await setJSONItem<T>(key, next, options);
  return next;
}

export const AsyncStorageService = {
  setItem,
  getItem,
  removeItem,
  mergeItem,
  multiSet,
  multiGet,
  multiRemove,
  clear,
  getAllKeys,
  setJSONItem,
  getJSONItem,
  updateJSONItem,
};

export default AsyncStorageService;


