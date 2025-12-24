import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Onboarding1Screen } from "@features/Onboarding/screens/Onboarding1Screen";
import { Onboarding2Screen } from "@features/Onboarding/screens/Onboarding2Screen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
};

export const OnboardingStack = () => {
    return (
        <Stack.Navigator 
        screenOptions={{headerShown:false}}
        initialRouteName="Onboarding1">
            <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
            <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
        </Stack.Navigator>  
    )
}
