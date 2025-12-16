import { Platform, PermissionsAndroid } from 'react-native';
import Contacts, { Contact as RNContact } from 'react-native-contacts';
import { ContactMinimal } from '@shared/types/contactType';

export const requestContactsPermission = async (): Promise<boolean> => {
  console.log('[ContactService] requestContactsPermission called, Platform.OS:', Platform.OS);
  if (Platform.OS === 'ios') {
    try {
      console.log('[ContactService] Calling Contacts.checkPermission()...');
      
      let permission: string;
      try {
        // checkPermission이 응답하지 않을 수 있으므로 타임아웃 추가
        const permissionPromise = Contacts.checkPermission();
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Permission check timeout')), 3000);
        });
        permission = await Promise.race([permissionPromise, timeoutPromise]) as string;
        console.log('[ContactService] iOS permission status:', permission);
      } catch (checkError: any) {
        // checkPermission이 실패하면 권한이 결정되지 않은 것으로 간주하고 바로 요청
        console.warn('[ContactService] checkPermission failed or timeout, assuming undefined:', checkError?.message);
        permission = 'undefined';
      }
      
      // 이미 권한이 허용된 경우
      if (permission === 'authorized') {
        return true;
      }
      
      // 권한이 거부되었거나 제한된 경우에도 한 번 더 요청 시도
      // (사용자가 설정에서 변경했을 수 있음)
      const permissionStr = permission as string;
      const isDeniedOrRestricted = permission === 'denied' || permissionStr === 'restricted' || permissionStr === 'limited';
      
      // 권한이 없거나 거부된 경우 권한 요청 시도
      if (permission === 'undefined' || isDeniedOrRestricted) {
        console.log('[ContactService] Requesting iOS contacts permission...');
        console.log('[ContactService] Calling Contacts.requestPermission()...');
        
        try {
          // 권한 요청도 타임아웃 추가 (15초 - 사용자가 다이얼로그에 응답할 시간)
          const requestPromise = Contacts.requestPermission();
          const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('Permission request timeout')), 15000);
          });
          
          const req = await Promise.race([requestPromise, timeoutPromise]) as string;
          console.log('[ContactService] iOS permission request result:', req);
          
          if (req === 'authorized') {
            return true;
          }
          
          // 요청 후에도 거부된 경우
          if (isDeniedOrRestricted) {
            console.log('[ContactService] Permission denied or restricted, user must enable in Settings');
          }
          return false;
        } catch (requestError: any) {
          console.error('[ContactService] requestPermission failed or timeout:', requestError?.message);
          return false;
        }
      }
      
      // 예상치 못한 경우
      console.warn('[ContactService] Unexpected permission status:', permission);
      return false;
    } catch (error) {
      console.error('[ContactService] Error requesting iOS contacts permission:', error);
      return false;
    }
  }

  if (Platform.OS === 'android') {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    );
    if (hasPermission) {
      return true;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
};

const extractPrimaryPhone = (contact: RNContact): string | null => {
  if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return null;
  const first = contact.phoneNumbers[0];
  if (!first.number) return null;
  return first.number.replace(/\s+/g, '');
};

export const getAllContactsMinimal = async (): Promise<ContactMinimal[]> => {
  console.log('[ContactService] getAllContactsMinimal called');
  try {
    console.log('[ContactService] Requesting permission...');
    const hasPermission = await requestContactsPermission();
    console.log('[ContactService] Permission result:', hasPermission);
    if (!hasPermission) {
      console.log('[ContactService] No permission to access contacts');
      throw new Error('NO_PERMISSION');
    }

    console.log('[ContactService] Fetching contacts...');
    const contacts = await Contacts.getAll();
    console.log('[ContactService] Fetched', contacts.length, 'contacts');

    return contacts
      .map((c) => {
        const phoneNumber = extractPrimaryPhone(c);
        if (!phoneNumber) return null;

        const name = c.displayName || [c.givenName, c.familyName].filter(Boolean).join(' ').trim();
        if (!name) return null;

        return {
          id: c.recordID,
          name,
          phoneNumber,
        } as ContactMinimal;
      })
      .filter((c): c is ContactMinimal => c !== null);
  } catch (error: any) {
    console.error('[ContactService] Error getting contacts:', error);
    throw error;
  }
};







