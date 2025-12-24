import { useEffect } from "react";
import { useOnboardingStore } from "@stores/onboardingStore";
export const useOnboarding = () => {
 const {isOnboardingCompleted,isLoading,checkOnboardingStatus,completeOnboarding} = useOnboardingStore();
 useEffect(()=>{
  checkOnboardingStatus();
 },[])
  return {
    isOnboardingCompleted,
    isLoading,
    checkOnboardingStatus,
    completeOnboarding,
  };
};
