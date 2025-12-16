import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingScreen1 } from "@features/Onboarding/Screens/OnboardingScreen1";
import { OnboardingScreen2 } from "@features/Onboarding/Screens/OnboardingScreen2";
import { OnboardingScreen3 } from "@features/Onboarding/Screens/OnboardingScreen3";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
};

export const OnboardingStack = () => {
    return (
        <Stack.Navigator 
        screenOptions={{headerShown:false}}
        initialRouteName="Onboarding1">
            <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
            <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
            <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
        </Stack.Navigator>  
    )
}
