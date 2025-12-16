import { create } from 'zustand';
import { Relation } from '@/shared/types/relationType';
import { AsyncStorageService } from '@services/asyncStorageService';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { useGraphStore, createLinksFromNodes } from './graphStore';
import uuid from 'react-native-uuid';

interface RelationStore {
  relations: Relation[];
  setRelations: (relations: Relation[]) => void;
  addRelation: (relation: Omit<Relation, 'id'>) => Promise<void>;
  updateRelation: (relationId: string, updates: Partial<Relation>) => Promise<void>;
  deleteRelation: (relationId: string) => Promise<void>;
  getRelationsByPersonId: (personId: string) => Relation[];
}

export const useRelationStore = create<RelationStore>((set, get) => ({
  relations: [],

  setRelations: (relations: Relation[]) => {
    set({ relations });
    // graphStore의 links도 업데이트
    const nodes = useGraphStore.getState().nodes;
    const links = createLinksFromNodes(nodes, relations);
    useGraphStore.getState().setLinks(links);
  },

  addRelation: async (relationData: Omit<Relation, 'id'>) => {
    const newRelation: Relation = {
      id: uuid.v4() as string,
      sourcePersonId: relationData.sourcePersonId,
      targetPersonId: relationData.targetPersonId,
      description: relationData.description,
      strength: relationData.strength,
      arrowDirection: relationData.arrowDirection,
    };

    const updatedRelations = [...get().relations, newRelation];
    set({ relations: updatedRelations });

    // graphStore의 links도 업데이트
    const nodes = useGraphStore.getState().nodes;
    const links = createLinksFromNodes(nodes, updatedRelations);
    useGraphStore.getState().setLinks(links);

    // AsyncStorage에 저장
    await AsyncStorageService.setJSONItem<Relation[]>(
      STORAGE_KEYS.RELATIONS,
      updatedRelations,
    );
  },

  updateRelation: async (relationId: string, updates: Partial<Relation>) => {
    const updatedRelations = get().relations.map((relation) => {
      if (relation.id === relationId) {
        return { ...relation, ...updates };
      }
      return relation;
    });

    set({ relations: updatedRelations });

    // graphStore의 links도 업데이트
    const nodes = useGraphStore.getState().nodes;
    const links = createLinksFromNodes(nodes, updatedRelations);
    useGraphStore.getState().setLinks(links);

    // AsyncStorage에 저장
    await AsyncStorageService.setJSONItem<Relation[]>(
      STORAGE_KEYS.RELATIONS,
      updatedRelations,
    );
  },

  deleteRelation: async (relationId: string) => {
    const updatedRelations = get().relations.filter(
      (relation) => relation.id !== relationId,
    );

    set({ relations: updatedRelations });

    // graphStore의 links도 업데이트
    const nodes = useGraphStore.getState().nodes;
    const links = createLinksFromNodes(nodes, updatedRelations);
    useGraphStore.getState().setLinks(links);

    // AsyncStorage에 저장
    await AsyncStorageService.setJSONItem<Relation[]>(
      STORAGE_KEYS.RELATIONS,
      updatedRelations,
    );
  },

  getRelationsByPersonId: (personId: string) => {
    return get().relations.filter(
      (relation) =>
        relation.sourcePersonId === personId ||
        relation.targetPersonId === personId,
    );
  },
}));

