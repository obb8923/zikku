import { PersonType } from '@/shared/types/personType';
import { Relation } from '@/shared/types/relationType';

export const ENABLE_DEV_DATA_MOCK = true;

// 'ko' | 'en' 중 선택하여 사용하세요.
// Select 'ko' or 'en' to use.
export const MOCK_DATA_LANGUAGE = 'ko' as 'ko' | 'en';

const DEV_MOCK_PEOPLE_KO: PersonType[] = [
  {
    id: 'mock-person-1',
    name: '박상호', // 아빠
    memo: '우리 아빠. 주말마다 등산을 다니고 사진 찍는 걸 좋아한다.',
    properties: [
      {
        id: 'prop-p1-tags',
        type: 'tags',
        values: ['가족', '사진'],
      },
      {
        id: 'prop-p1-organizations',
        type: 'organizations',
        values: ['가족'],
      },
      {
        id: 'prop-p1-phone',
        type: 'phone',
        values: ['010-1111-1111'],
      },
      {
        id: 'prop-p1-likes',
        type: 'likes',
        values: ['등산'],
      },
    ],
  },
  {
    id: 'mock-person-2',
    name: '이정미', // 엄마
    memo: '우리 엄마. 요리와 여행을 좋아하고 새로운 카페를 찾는 걸 즐긴다.',
    properties: [
      {
        id: 'prop-p2-tags',
        type: 'tags',
        values: ['가족', '요리'],
      },
      {
        id: 'prop-p2-organizations',
        type: 'organizations',
        values: ['가족'],
      },
      {
        id: 'prop-p2-phone',
        type: 'phone',
        values: ['010-2222-2222'],
      },
      {
        id: 'prop-p2-likes',
        type: 'likes',
        values: ['여행'],
      },
    ],
  },
  {
    id: 'mock-person-3',
    name: '박정우', // 형
    memo: '형. 스타트업에서 서버 개발자로 일한다.',
    properties: [
      {
        id: 'prop-p3-tags',
        type: 'tags',
        values: ['가족', '백엔드'],
      },
      {
        id: 'prop-p3-organizations',
        type: 'organizations',
        values: ['가족'],
      },
      {
        id: 'prop-p3-phone',
        type: 'phone',
        values: ['010-3333-3333'],
      },
      {
        id: 'prop-p3-likes',
        type: 'likes',
        values: ['등산'],
      },
    ],
  },
  {
    id: 'mock-person-4',
    name: '정현우',
    memo: '러닝크루에서 가장 먼저 친해진 사람. 백엔드 개발자.',
    properties: [
      { id: 'prop-p4-tags', type: 'tags', values: ['백엔드', '동호회'] },
      { id: 'prop-p4-organizations', type: 'organizations', values: ['러닝크루'] },
      { id: 'prop-p4-phone', type: 'phone', values: ['010-4444-4444'] },
      { id: 'prop-p4-likes', type: 'likes', values: ['러닝'] },
    ],
  },
  {
    id: 'mock-person-5',
    name: '김다온',
    memo: '러닝크루에서 페이스 조절 잘 알려주는 사람.',
    properties: [
      { id: 'prop-p5-tags', type: 'tags', values: ['동호회'] },
      { id: 'prop-p5-organizations', type: 'organizations', values: ['러닝크루'] },
      { id: 'prop-p5-phone', type: 'phone', values: ['010-5555-5555'] },
      { id: 'prop-p5-likes', type: 'likes', values: ['요가'] },
    ],
  },
  {
    id: 'mock-person-6',
    name: '최다민',
    memo: '러닝크루 리더. 운영 경험이 많다.',
    properties: [
      { id: 'prop-p6-tags', type: 'tags', values: ['동호회', '운영'] },
      { id: 'prop-p6-organizations', type: 'organizations', values: ['러닝크루'] },
      { id: 'prop-p6-phone', type: 'phone', values: ['010-6666-6666'] },
      { id: 'prop-p6-likes', type: 'likes', values: ['클라이밍'] },
    ],
  },
  {
    id: 'mock-person-7',
    name: '윤태호',
    memo: '주말마다 장거리 러닝 같이 하는 사이.',
    properties: [
      { id: 'prop-p7-tags', type: 'tags', values: ['동호회'] },
      { id: 'prop-p7-organizations', type: 'organizations', values: ['러닝크루'] },
      { id: 'prop-p7-phone', type: 'phone', values: ['010-7777-7777'] },
      { id: 'prop-p7-likes', type: 'likes', values: ['사진'] },
    ],
  },
  {
    id: 'mock-person-8',
    name: '백서형',
    memo: '러닝크루에서 새로 들어온 멤버. 활발하고 밝음.',
    properties: [
      { id: 'prop-p8-tags', type: 'tags', values: ['동호회'] },
      { id: 'prop-p8-organizations', type: 'organizations', values: ['러닝크루'] },
      { id: 'prop-p8-phone', type: 'phone', values: ['010-8888-8888'] },
      { id: 'prop-p8-likes', type: 'likes', values: ['카페 탐방'] },
    ],
  },
  {
    id: 'mock-person-9',
    name: '이서연',
    memo: '같이 일하는 프론트엔드 동료.',
    properties: [
      { id: 'prop-p9-tags', type: 'tags', values: ['프론트엔드', '동료'] },
      { id: 'prop-p9-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p9-phone', type: 'phone', values: ['010-9999-9999'] },
      { id: 'prop-p9-personality', type: 'personality', values: ['ENFP'] },
    ],
  },
  {
    id: 'mock-person-10',
    name: '김민주',
    memo: '데이터 분석가. 사진 찍는 취미 있다.',
    properties: [
      { id: 'prop-p10-tags', type: 'tags', values: ['데이터', '친구'] },
      { id: 'prop-p10-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p10-phone', type: 'phone', values: ['010-1212-1212'] },
      { id: 'prop-p10-likes', type: 'likes', values: ['필름카메라'] },
    ],
  },
  {
    id: 'mock-person-11',
    name: '최유진',
    memo: 'PM. 조율 능력 뛰어남.',
    properties: [
      { id: 'prop-p11-tags', type: 'tags', values: ['PM'] },
      { id: 'prop-p11-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p11-phone', type: 'phone', values: ['010-1313-1313'] },
      { id: 'prop-p11-likes', type: 'likes', values: ['보드게임'] },
    ],
  },
  {
    id: 'mock-person-12',
    name: '한소진',
    memo: '콘텐츠 마케터. 브랜딩에 관심 많음.',
    properties: [
      { id: 'prop-p12-tags', type: 'tags', values: ['마케팅'] },
      { id: 'prop-p12-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p12-phone', type: 'phone', values: ['010-1414-1414'] },
      { id: 'prop-p12-likes', type: 'likes', values: ['브랜딩 서적'] },
    ],
  },
  {
    id: 'mock-person-13',
    name: '유지혁',
    memo: '행사 담당 DevRel.',
    properties: [
      { id: 'prop-p13-tags', type: 'tags', values: ['DevRel'] },
      { id: 'prop-p13-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p13-phone', type: 'phone', values: ['010-1515-1515'] },
      { id: 'prop-p13-likes', type: 'likes', values: ['클라이밍'] },
    ],
  },
  {
    id: 'mock-person-14',
    name: '문지환',
    memo: '내부 교육 담당 에반젤리스트.',
    properties: [
      { id: 'prop-p14-tags', type: 'tags', values: ['교육'] },
      { id: 'prop-p14-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p14-phone', type: 'phone', values: ['010-1616-1616'] },
      { id: 'prop-p14-likes', type: 'likes', values: ['테니스'] },
    ],
  },
  {
    id: 'mock-person-15',
    name: '배민호',
    memo: 'SRE 출신 멘토. 조언을 자주 해준다.',
    properties: [
      { id: 'prop-p15-tags', type: 'tags', values: ['SRE', '멘토'] },
      { id: 'prop-p15-organizations', type: 'organizations', values: ['회사'] },
      { id: 'prop-p15-phone', type: 'phone', values: ['010-1717-1717'] },
      { id: 'prop-p15-personality', type: 'personality', values: ['ISTJ'] },
    ],
  },
];

const DEV_MOCK_RELATIONS_KO: Relation[] = [
  // ===========================
  // 가족 관계
  // ===========================
  {
    id: 'rel-1',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-1', // 아빠
    description: '가족',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-2',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-2', // 엄마
    description: '가족',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-3',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-3', // 형
    description: '가족',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-4',
    sourcePersonId: 'mock-person-1',
    targetPersonId: 'mock-person-2',
    description: '부부',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-5',
    sourcePersonId: 'mock-person-1',
    targetPersonId: 'mock-person-3',
    description: '부자 관계',
    strength: 4,
    arrowDirection: 'both',
  },

  // ===========================
  // 러닝크루 관계
  // ===========================
  {
    id: 'rel-6',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-4',
    description: '러닝크루에서 가장 자주 보는 멤버',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-7',
    sourcePersonId: 'mock-person-4',
    targetPersonId: 'mock-person-5',
    description: '러닝 페이스 조절 알려준 사이',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-8',
    sourcePersonId: 'mock-person-4',
    targetPersonId: 'mock-person-6',
    description: '러닝크루 운영 관련 대화',
    strength: 4,
    arrowDirection: 'right',
  },
  {
    id: 'rel-9',
    sourcePersonId: 'mock-person-5',
    targetPersonId: 'mock-person-8',
    description: '새 멤버 런닝 루틴 공유',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-10',
    sourcePersonId: 'mock-person-6',
    targetPersonId: 'mock-person-7',
    description: '장거리 러닝 파트너',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-11',
    sourcePersonId: 'mock-person-7',
    targetPersonId: 'mock-person-8',
    description: '사진 취미 공유',
    strength: 2,
    arrowDirection: 'both',
  },

  // ===========================
  // 회사 관계
  // ===========================
  {
    id: 'rel-12',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-9',
    description: '프론트엔드 공부 조언',
    strength: 3,
    arrowDirection: 'right',
  },
  {
    id: 'rel-13',
    sourcePersonId: 'mock-person-9',
    targetPersonId: 'mock-person-10',
    description: '데이터 시각화 협업',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-14',
    sourcePersonId: 'mock-person-10',
    targetPersonId: 'mock-person-11',
    description: '신규 기능 기획 논의',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-15',
    sourcePersonId: 'mock-person-11',
    targetPersonId: 'mock-person-12',
    description: '마케팅 자료 검토',
    strength: 3,
    arrowDirection: 'right',
  },
  {
    id: 'rel-16',
    sourcePersonId: 'mock-person-12',
    targetPersonId: 'mock-person-13',
    description: '행사 홍보 협업',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-17',
    sourcePersonId: 'mock-person-13',
    targetPersonId: 'mock-person-14',
    description: '교육 세션 공동 진행',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-18',
    sourcePersonId: 'mock-person-15',
    targetPersonId: 'mock-person-9',
    description: 'SRE 관련 멘토링',
    strength: 5,
    arrowDirection: 'right',
  },
  {
    id: 'rel-19',
    sourcePersonId: 'mock-person-15',
    targetPersonId: 'mock-person-11',
    description: 'iOS 기술 조언',
    strength: 4,
    arrowDirection: 'both',
  },

  // ===========================
  // 섞여 있는 자연스러운 연결
  // ===========================
  {
    id: 'rel-20',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-12',
    description: '브랜딩 관련 이야기 나눈 사이',
    strength: 2,
    arrowDirection: 'both',
  },
  {
    id: 'rel-21',
    sourcePersonId: 'mock-person-7',
    targetPersonId: 'mock-person-13',
    description: '회사 행사 관련 조언',
    strength: 2,
    arrowDirection: 'right',
  },
];

const DEV_MOCK_PEOPLE_EN: PersonType[] = [
  {
    id: 'mock-person-1',
    name: 'Robert Johnson', // Dad
    memo: 'My dad. Likes hiking and taking photos on weekends.',
    properties: [
      {
        id: 'prop-p1-tags',
        type: 'tags',
        values: ['Family', 'Photo'],
      },
      {
        id: 'prop-p1-organizations',
        type: 'organizations',
        values: ['Family'],
      },
      {
        id: 'prop-p1-phone',
        type: 'phone',
        values: ['010-1111-1111'],
      },
      {
        id: 'prop-p1-likes',
        type: 'likes',
        values: ['Hiking'],
      },
    ],
  },
  {
    id: 'mock-person-2',
    name: 'Sarah Johnson', // Mom
    memo: 'My mom. Likes cooking and traveling, enjoys finding new cafes.',
    properties: [
      {
        id: 'prop-p2-tags',
        type: 'tags',
        values: ['Family', 'Cooking'],
      },
      {
        id: 'prop-p2-organizations',
        type: 'organizations',
        values: ['Family'],
      },
      {
        id: 'prop-p2-phone',
        type: 'phone',
        values: ['010-2222-2222'],
      },
      {
        id: 'prop-p2-likes',
        type: 'likes',
        values: ['Travel'],
      },
    ],
  },
  {
    id: 'mock-person-3',
    name: 'Michael Johnson', // Brother
    memo: 'Brother. Works as a server developer at a startup.',
    properties: [
      {
        id: 'prop-p3-tags',
        type: 'tags',
        values: ['Family', 'Backend'],
      },
      {
        id: 'prop-p3-organizations',
        type: 'organizations',
        values: ['Family'],
      },
      {
        id: 'prop-p3-phone',
        type: 'phone',
        values: ['010-3333-3333'],
      },
      {
        id: 'prop-p3-likes',
        type: 'likes',
        values: ['Hiking'],
      },
    ],
  },
  {
    id: 'mock-person-4',
    name: 'David Martinez',
    memo: 'The first person I got close to in the running crew. Backend developer.',
    properties: [
      { id: 'prop-p4-tags', type: 'tags', values: ['Backend', 'Club'] },
      { id: 'prop-p4-organizations', type: 'organizations', values: ['Running Crew'] },
      { id: 'prop-p4-phone', type: 'phone', values: ['010-4444-4444'] },
      { id: 'prop-p4-likes', type: 'likes', values: ['Running'] },
    ],
  },
  {
    id: 'mock-person-5',
    name: 'Emily Chen',
    memo: 'Person who teaches pace control well in the running crew.',
    properties: [
      { id: 'prop-p5-tags', type: 'tags', values: ['Club'] },
      { id: 'prop-p5-organizations', type: 'organizations', values: ['Running Crew'] },
      { id: 'prop-p5-phone', type: 'phone', values: ['010-5555-5555'] },
      { id: 'prop-p5-likes', type: 'likes', values: ['Yoga'] },
    ],
  },
  {
    id: 'mock-person-6',
    name: 'James Wilson',
    memo: 'Running crew leader. Has a lot of operation experience.',
    properties: [
      { id: 'prop-p6-tags', type: 'tags', values: ['Club', 'Operation'] },
      { id: 'prop-p6-organizations', type: 'organizations', values: ['Running Crew'] },
      { id: 'prop-p6-phone', type: 'phone', values: ['010-6666-6666'] },
      { id: 'prop-p6-likes', type: 'likes', values: ['Climbing'] },
    ],
  },
  {
    id: 'mock-person-7',
    name: 'Christopher Brown',
    memo: 'Long-distance running partner on weekends.',
    properties: [
      { id: 'prop-p7-tags', type: 'tags', values: ['Club'] },
      { id: 'prop-p7-organizations', type: 'organizations', values: ['Running Crew'] },
      { id: 'prop-p7-phone', type: 'phone', values: ['010-7777-7777'] },
      { id: 'prop-p7-likes', type: 'likes', values: ['Photo'] },
    ],
  },
  {
    id: 'mock-person-8',
    name: 'Jessica Taylor',
    memo: 'New member in the running crew. Active and bright.',
    properties: [
      { id: 'prop-p8-tags', type: 'tags', values: ['Club'] },
      { id: 'prop-p8-organizations', type: 'organizations', values: ['Running Crew'] },
      { id: 'prop-p8-phone', type: 'phone', values: ['010-8888-8888'] },
      { id: 'prop-p8-likes', type: 'likes', values: ['Cafe Tour'] },
    ],
  },
  {
    id: 'mock-person-9',
    name: 'Ashley Williams',
    memo: 'Frontend colleague working together.',
    properties: [
      { id: 'prop-p9-tags', type: 'tags', values: ['Frontend', 'Colleague'] },
      { id: 'prop-p9-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p9-phone', type: 'phone', values: ['010-9999-9999'] },
      { id: 'prop-p9-personality', type: 'personality', values: ['ENFP'] },
    ],
  },
  {
    id: 'mock-person-10',
    name: 'Jennifer Davis',
    memo: 'Data analyst. Has a hobby of taking photos.',
    properties: [
      { id: 'prop-p10-tags', type: 'tags', values: ['Data', 'Friend'] },
      { id: 'prop-p10-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p10-phone', type: 'phone', values: ['010-1212-1212'] },
      { id: 'prop-p10-likes', type: 'likes', values: ['Film Camera'] },
    ],
  },
  {
    id: 'mock-person-11',
    name: 'Daniel Anderson',
    memo: 'PM. Excellent coordination skills.',
    properties: [
      { id: 'prop-p11-tags', type: 'tags', values: ['PM'] },
      { id: 'prop-p11-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p11-phone', type: 'phone', values: ['010-1313-1313'] },
      { id: 'prop-p11-likes', type: 'likes', values: ['Board Games'] },
    ],
  },
  {
    id: 'mock-person-12',
    name: 'Amanda Garcia',
    memo: 'Content Marketer. Interested in branding.',
    properties: [
      { id: 'prop-p12-tags', type: 'tags', values: ['Marketing'] },
      { id: 'prop-p12-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p12-phone', type: 'phone', values: ['010-1414-1414'] },
      { id: 'prop-p12-likes', type: 'likes', values: ['Branding Books'] },
    ],
  },
  {
    id: 'mock-person-13',
    name: 'Ryan Rodriguez',
    memo: 'Event Manager DevRel.',
    properties: [
      { id: 'prop-p13-tags', type: 'tags', values: ['DevRel'] },
      { id: 'prop-p13-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p13-phone', type: 'phone', values: ['010-1515-1515'] },
      { id: 'prop-p13-likes', type: 'likes', values: ['Climbing'] },
    ],
  },
  {
    id: 'mock-person-14',
    name: 'Matthew Thompson',
    memo: 'Internal Education Evangelist.',
    properties: [
      { id: 'prop-p14-tags', type: 'tags', values: ['Education'] },
      { id: 'prop-p14-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p14-phone', type: 'phone', values: ['010-1616-1616'] },
      { id: 'prop-p14-likes', type: 'likes', values: ['Tennis'] },
    ],
  },
  {
    id: 'mock-person-15',
    name: 'Kevin Moore',
    memo: 'Mentor from SRE background. Gives advice often.',
    properties: [
      { id: 'prop-p15-tags', type: 'tags', values: ['SRE', 'Mentor'] },
      { id: 'prop-p15-organizations', type: 'organizations', values: ['Company'] },
      { id: 'prop-p15-phone', type: 'phone', values: ['010-1717-1717'] },
      { id: 'prop-p15-personality', type: 'personality', values: ['ISTJ'] },
    ],
  },
];

const DEV_MOCK_RELATIONS_EN: Relation[] = [
  // ===========================
  // Family
  // ===========================
  {
    id: 'rel-1',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-1', // Dad
    description: 'Family',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-2',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-2', // Mom
    description: 'Family',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-3',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-3', // Brother
    description: 'Family',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-4',
    sourcePersonId: 'mock-person-1',
    targetPersonId: 'mock-person-2',
    description: 'Couple',
    strength: 5,
    arrowDirection: 'both',
  },
  {
    id: 'rel-5',
    sourcePersonId: 'mock-person-1',
    targetPersonId: 'mock-person-3',
    description: 'Father-Son',
    strength: 4,
    arrowDirection: 'both',
  },

  // ===========================
  // Running Crew
  // ===========================
  {
    id: 'rel-6',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-4',
    description: 'Running crew member',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-7',
    sourcePersonId: 'mock-person-4',
    targetPersonId: 'mock-person-5',
    description: 'Pace control teacher',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-8',
    sourcePersonId: 'mock-person-4',
    targetPersonId: 'mock-person-6',
    description: 'Operation discussion',
    strength: 4,
    arrowDirection: 'right',
  },
  {
    id: 'rel-9',
    sourcePersonId: 'mock-person-5',
    targetPersonId: 'mock-person-8',
    description: 'New member routine share',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-10',
    sourcePersonId: 'mock-person-6',
    targetPersonId: 'mock-person-7',
    description: 'Long distance partner',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-11',
    sourcePersonId: 'mock-person-7',
    targetPersonId: 'mock-person-8',
    description: 'Photo hobby share',
    strength: 2,
    arrowDirection: 'both',
  },

  // ===========================
  // Company
  // ===========================
  {
    id: 'rel-12',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-9',
    description: 'Frontend advice',
    strength: 3,
    arrowDirection: 'right',
  },
  {
    id: 'rel-13',
    sourcePersonId: 'mock-person-9',
    targetPersonId: 'mock-person-10',
    description: 'Data viz collab',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-14',
    sourcePersonId: 'mock-person-10',
    targetPersonId: 'mock-person-11',
    description: 'New feature planning',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-15',
    sourcePersonId: 'mock-person-11',
    targetPersonId: 'mock-person-12',
    description: 'Marketing review',
    strength: 3,
    arrowDirection: 'right',
  },
  {
    id: 'rel-16',
    sourcePersonId: 'mock-person-12',
    targetPersonId: 'mock-person-13',
    description: 'Event promo collab',
    strength: 4,
    arrowDirection: 'both',
  },
  {
    id: 'rel-17',
    sourcePersonId: 'mock-person-13',
    targetPersonId: 'mock-person-14',
    description: 'Edu session co-host',
    strength: 3,
    arrowDirection: 'both',
  },
  {
    id: 'rel-18',
    sourcePersonId: 'mock-person-15',
    targetPersonId: 'mock-person-9',
    description: 'SRE mentoring',
    strength: 5,
    arrowDirection: 'right',
  },
  {
    id: 'rel-19',
    sourcePersonId: 'mock-person-15',
    targetPersonId: 'mock-person-11',
    description: 'iOS advice',
    strength: 4,
    arrowDirection: 'both',
  },

  // ===========================
  // Mixed / Natural Connections
  // ===========================
  {
    id: 'rel-20',
    sourcePersonId: 'mock-person-me',
    targetPersonId: 'mock-person-12',
    description: 'Branding talk',
    strength: 2,
    arrowDirection: 'both',
  },
  {
    id: 'rel-21',
    sourcePersonId: 'mock-person-7',
    targetPersonId: 'mock-person-13',
    description: 'Event advice',
    strength: 2,
    arrowDirection: 'right',
  },
];

export const DEV_MOCK_PEOPLE = MOCK_DATA_LANGUAGE === 'ko' ? DEV_MOCK_PEOPLE_KO : DEV_MOCK_PEOPLE_EN;
export const DEV_MOCK_RELATIONS = MOCK_DATA_LANGUAGE === 'ko' ? DEV_MOCK_RELATIONS_KO : DEV_MOCK_RELATIONS_EN;
