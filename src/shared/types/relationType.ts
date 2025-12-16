export type ArrowDirection = 'right' | 'left' | 'both' | 'none';
export type RelationStrength = 1 | 2 | 3 | 4 | 5;
export type RelationDescription = string;

export type Relation = {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  description: RelationDescription;
  strength: RelationStrength;
  arrowDirection: ArrowDirection;
};

