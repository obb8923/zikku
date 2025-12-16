import React from 'react';
import {ArchiveStack} from '@/shared/nav/stack/ArchiveStack';
import {MoreStack} from '@/shared/nav/stack/MoreStack';
import {MapStack} from '@/shared/nav/stack/MapStack';
import { useActiveTab } from '@stores/tabStore';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';

export const AppTab = () => {
  const activeTab = useActiveTab();
 
  // 현재 활성화된 탭에 따라 해당 스택을 렌더링
  switch (activeTab) {
    case TAB_NAME.MAP:
      return <MapStack />;
    case TAB_NAME.ARCHIVE:
      return <ArchiveStack />;
    case TAB_NAME.MORE:
      return <MoreStack />;
    default:
      return <MapStack />; 
  }
};


