import { create } from 'zustand';
import { AsyncStorageService } from '@services/asyncStorageService';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { PersonType, PropertyType } from '@/shared/types/personType';
import { Relation } from '@/shared/types/relationType';
import { GraphNode, GraphLink } from '@/shared/types/graphType';
import { usePersonStore } from './personStore';
import { useGraphStore, createLinksFromNodes } from './graphStore';
import { useRelationStore } from './relationStore';
import { useOnboardingStore } from './onboardingStore';
import { useThemeStore } from './themeStore';
import { useSubscriptionStore } from './subscriptionStore';
import { initIAP } from '@services/iapService';
import uuid from 'react-native-uuid';
import i18n, { loadSavedLanguage } from '@i18n/index';
import {
  DEV_MOCK_PEOPLE,
  DEV_MOCK_RELATIONS,
  ENABLE_DEV_DATA_MOCK,
} from '@constants/MOCK';

// 기존 Person 타입 (마이그레이션용)
type OldPerson = {
  id: string;
  name: string;
  phone?: string;
  description?: string;
  properties?: PropertyType[];
  memo?: string;
  isSelf?: boolean;
};

const createDefaultProperties = (): PropertyType[] => {
  return [
    {
      id: uuid.v4() as string,
      type: 'tags',
      values: [],
    },
    {
      id: uuid.v4() as string,
      type: 'organizations',
      values: [],
    },
  ];
};

// 기존 데이터를 새로운 형식으로 마이그레이션
const migratePerson = (oldPerson: OldPerson): PersonType => {
  // 이미 새로운 형식인 경우 그대로 반환
  if (oldPerson.properties !== undefined && oldPerson.memo !== undefined) {
    return oldPerson as PersonType;
  }

  // 기존 형식인 경우 마이그레이션
  const properties = createDefaultProperties();
  
  // phone이 있으면 phone property 추가
  if (oldPerson.phone) {
    properties.push({
      id: uuid.v4() as string,
      type: 'phone',
      values: [oldPerson.phone],
    });
  }

  return {
    id: oldPerson.id,
    name: oldPerson.name,
    properties,
    memo: oldPerson.description || oldPerson.memo || '',
    isSelf: oldPerson.isSelf,
  };
};

const ensureSelfPerson = (
  people: PersonType[],
  selfName: string,
): { people: PersonType[]; updated: boolean } => {
  let updated = false;

  const existingSelfIndex = people.findIndex((person) => person.isSelf);
  let selfPerson =
    existingSelfIndex !== -1 ? { ...people[existingSelfIndex], isSelf: true } : undefined;

  // 이름으로 기존 기본 사람 찾기 (과거 데이터)
  if (!selfPerson) {
    const nameMatched = people.find((person) => person.name === selfName);
    if (nameMatched) {
      selfPerson = { ...nameMatched, isSelf: true };
      updated = true;
    }
  }

  // 없으면 새로 생성
  if (!selfPerson) {
    selfPerson = {
      id: uuid.v4() as string,
      name: selfName,
      properties: [],
      memo: '',
      isSelf: true,
    };
    updated = true;
  } else if (!selfPerson.isSelf) {
    selfPerson = { ...selfPerson, isSelf: true };
    updated = true;
  }

  const remainingPeople = people.filter((person) => person.id !== selfPerson!.id);
  const reordered = [selfPerson, ...remainingPeople];

  // 기존에 맨 앞에 없었으면 업데이트 표시
  if (existingSelfIndex > 0) {
    updated = true;
  }

  return { people: reordered, updated };
};

interface InitStore {
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitStore>((set) => ({
  isInitialized: false,

  initialize: async () => {
    try {
      // 0. 저장된 언어 설정 불러오기 및 적용
      const savedLanguage = await loadSavedLanguage();
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }

      // 0-1. 테마 초기화
      await useThemeStore.getState().initializeTheme();

      // 0-2. IAP 초기화 (Nitro Modules 초기화 대기)
      // 구독 상태를 로드하기 전에 IAP를 먼저 초기화해야 함
      // Nitro Modules 초기화를 위해 약간 지연
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      await initIAP().catch(() => {
        // 에러는 initIAP 내부에서 처리되므로 조용히 실패 처리
        // IAP 초기화 실패해도 앱은 정상적으로 실행됨
      });

      // 0-3. 구독 상태 로드
      await useSubscriptionStore.getState().loadSubscriptionStatus();

      // 0-4. 앱 실행 시 영수증 재검증 (IAP 초기화 후 실행)
      await useSubscriptionStore.getState().refreshSubscriptionStatus();

      // 1. 온보딩 상태 확인
      await useOnboardingStore.getState().checkOnboardingStatus();

      // 2. AsyncStorage에서 지인 정보 불러오기
      const oldPeople = await AsyncStorageService.getJSONItem<OldPerson[]>(
        STORAGE_KEYS.PEOPLE,
      );

      // 3. 기존 데이터를 새로운 형식으로 마이그레이션
      let migratedPeople = (oldPeople || []).map(migratePerson);

      // 4. 마이그레이션이 발생한 경우 저장
      if (oldPeople && oldPeople.length > 0) {
        const needsMigration = oldPeople.some(
          (p) => p.properties === undefined || p.memo === undefined
        );
        
        if (needsMigration) {
          await AsyncStorageService.setJSONItem<PersonType[]>(
            STORAGE_KEYS.PEOPLE,
            migratedPeople,
          );
        }
      }

      // 5. 개발 모드에서 목 데이터 적용
      if (__DEV__ && ENABLE_DEV_DATA_MOCK) {
        migratedPeople = DEV_MOCK_PEOPLE;
      }

      // 5-1. 아무것도 저장하지 않은 초기 상태일 때 기본 사람 추가
      if (migratedPeople.length === 0) {
        const defaultPerson: PersonType = {
          id: uuid.v4() as string,
          name: i18n.t('common.defaultPersonName'),
          properties: [],
          memo: '',
          isSelf: true,
        };
        migratedPeople = [defaultPerson];
        
        // AsyncStorage에 기본 사람 저장
        await AsyncStorageService.setJSONItem<PersonType[]>(
          STORAGE_KEYS.PEOPLE,
          migratedPeople,
        );
      }

      // 5-2. '나' 데이터 보강 및 맨 위 배치
      const { people: ensuredPeople, updated } = ensureSelfPerson(
        migratedPeople,
        i18n.t('common.defaultPersonName'),
      );
      migratedPeople = ensuredPeople;
      if (updated) {
        await AsyncStorageService.setJSONItem<PersonType[]>(
          STORAGE_KEYS.PEOPLE,
          migratedPeople,
        );
      }

      // 6. personStore에 설정 (이미 정렬된 값이 저장되어 있음)
      usePersonStore.getState().setPeople(migratedPeople);

      // 7. graphStore에 노드 동기화
      let nodes: GraphNode[] = [];
      if (migratedPeople.length > 0) {
        nodes = migratedPeople.map((person) => ({
          id: person.id,
          personId: person.id,
          name: person.name,
          nodeType: 'person' as const,
          x: Math.random() * 400,
          y: Math.random() * 600,
        }));
        useGraphStore.getState().setNodes(nodes);
      } else {
        useGraphStore.getState().setNodes([]);
      }

      // 8. AsyncStorage에서 관계 정보 불러오기
      const storedRelations =
        await AsyncStorageService.getJSONItem<Relation[]>(
          STORAGE_KEYS.RELATIONS,
        );

      let relationData = storedRelations || [];
      // 9. 개발 모드에서 목 데이터 적용
      if (__DEV__ && ENABLE_DEV_DATA_MOCK) {
        relationData = DEV_MOCK_RELATIONS;
      }

      // 9-1. 목 데이터에서 사용하던 기존 self ID를 현재 self ID로 매핑
      const selfId = migratedPeople[0]?.id;
      if (selfId) {
        const legacySelfIds = ['mock-person-me'];
        relationData = relationData.map((relation) => {
          const mapId = (id: string) => (legacySelfIds.includes(id) ? selfId : id);
          return {
            ...relation,
            sourcePersonId: mapId(relation.sourcePersonId),
            targetPersonId: mapId(relation.targetPersonId),
          };
        });
      }

      // 10. relationStore에 설정
      useRelationStore.getState().setRelations(relationData);

      // 11. graphStore에 링크 동기화 - 통합된 엣지 생성 함수 사용
      const links = createLinksFromNodes(nodes, relationData);
      useGraphStore.getState().setLinks(links);

      // 12. 초기화 완료
      set({ isInitialized: true });
    } catch (error) {
      console.error('초기화 중 오류 발생:', error);
      // 오류 발생 시 빈 배열로 설정
      usePersonStore.getState().setPeople([]);
      useGraphStore.getState().setNodes([]);
      useGraphStore.getState().setLinks([]);
      useRelationStore.getState().setRelations([]);
      set({ isInitialized: true });
    }
  },
}));

