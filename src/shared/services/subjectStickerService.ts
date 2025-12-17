import { NativeModules } from 'react-native';

export type StickerResult = {
  id: string;
  uri: string;
  width: number;
  height: number;
  osVersion: string;
  method: 'visionKit' | 'visionMask';
};

type NativeSubjectStickerExtractor = {
  isSubjectExtractionSupported: () => Promise<boolean>;
  analyzeImage: (path: string) => Promise<StickerResult[]>;
};

const { SubjectStickerExtractor } = NativeModules as {
  SubjectStickerExtractor?: NativeSubjectStickerExtractor;
};

const getModule = (): NativeSubjectStickerExtractor => {
  if (!SubjectStickerExtractor) {
    throw new Error('SubjectStickerExtractor native module is not linked.');
  }

  return SubjectStickerExtractor;
};

export const SubjectStickerService = {
  async isSupported(): Promise<boolean> {
    try {
      const module = getModule();
      return await module.isSubjectExtractionSupported();
    } catch {
      return false;
    }
  },

  async analyzeImage(path: string): Promise<StickerResult[]> {
    const module = getModule();
    return module.analyzeImage(path);
  },
};


