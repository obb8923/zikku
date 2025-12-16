import { NavigationContainer, NavigationState, PartialState } from '@react-navigation/native';
import { OnboardingStack } from "@nav/stack/OnboardingStack";
import { AppTab } from "@nav/tab/AppTab";
import { useOnboardingStore } from '@stores/onboardingStore';
import { useRef } from 'react';

export const RootStack = () => {
  const { isOnboardingCompleted, isLoading } = useOnboardingStore();
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  const getActiveRouteName = (state?: NavigationState | PartialState<NavigationState>): string | undefined => {
    if (!state) return undefined;
    const route = state.routes[state.index || 0];
    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }
    return route.name;
  };

  const handleStateChange = () => {
    const currentRouteName = getActiveRouteName(navigationRef.current?.getRootState?.());
    if (currentRouteName && routeNameRef.current !== currentRouteName) {
      routeNameRef.current = currentRouteName;
    }
  };

  if (isLoading) {
    return null; // 또는 로딩 화면
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const currentRouteName = getActiveRouteName(navigationRef.current?.getRootState?.());
        routeNameRef.current = currentRouteName;
      }}
      onStateChange={handleStateChange}
    >
      {!isOnboardingCompleted ? <AppTab /> : <OnboardingStack />}
    </NavigationContainer>
  );
};