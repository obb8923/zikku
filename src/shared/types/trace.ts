export interface Trace {
  id?: string; // Supabase에서 생성된 UUID
  user_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string; // ISO 문자열 (Supabase timestamptz와 호환)
  localId?: string; // 클라이언트에서만 사용하는 임시 ID
}


