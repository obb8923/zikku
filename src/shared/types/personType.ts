export type PropertyValues =
  | 'tags'
  | 'organizations'
  | 'phone'
  | 'birthday'
  | 'likes'
  | 'dislikes'
  | 'personality'
  | 'custom';

export interface PropertyType {
  id: string;
  type: PropertyValues;
  values: string[];
  customLabel?: string;
}

export type PersonType = {
  id: string;
  name: string;
  properties: PropertyType[];
  memo: string;
  isSelf?: boolean;
};

