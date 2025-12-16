import React from 'react';
import {GraphStack} from '@nav/stack/GraphStack';
import {SettingStack} from '@nav/stack/SettingStack';
import {PeopleStack} from '@nav/stack/PeopleStack';
import { useActiveTab } from '@stores/tabStore';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';

export const AppTab = () => {
  const activeTab = useActiveTab();
 
  // 현재 활성화된 탭에 따라 해당 스택을 렌더링
  switch (activeTab) {
    case TAB_NAME.PEOPLE:
      return <PeopleStack />;
    case TAB_NAME.GRAPH:
      return <GraphStack />;
    case TAB_NAME.SETTING:
      return <SettingStack />;
    default:
      return <PeopleStack />; 
  }
};


