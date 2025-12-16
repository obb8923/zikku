declare module '*.svg' {
    const content: any;
    export default content;
  }
  
declare module '@env' {
  export const GOOGLE_MOBILE_ADS_UNIT_ID_NATIVE_ANDROID: string;
  export const GOOGLE_MOBILE_ADS_UNIT_ID_NATIVE_IOS: string;
}