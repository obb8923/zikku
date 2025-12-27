import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Onboarding1Screen } from "@features/Onboarding/screens/Onboarding1Screen";
import { Onboarding2Screen } from "@features/Onboarding/screens/Onboarding2Screen";
import { Onboarding3Screen } from "@features/Onboarding/screens/Onboarding3Screen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
};

export const OnboardingStack = () => {
    return (
        <Stack.Navigator 
        screenOptions={{headerShown:false,animation:'fade'}}
        initialRouteName="Onboarding1">
            <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
            <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
            <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
        </Stack.Navigator>  
    )
}
