declare module '*.svg' {
    const content: any;
    export default content;
  }
  
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const SUPABASE_WEB_CLIENT_KEY: string;
  export const SUPABASE_IOS_CLIENT_KEY: string;
  export const GOOGLE_MOBILE_ADS_UNIT_ID_NATIVE_ANDROID: string;
  export const GOOGLE_MOBILE_ADS_UNIT_ID_NATIVE_IOS: string;
}