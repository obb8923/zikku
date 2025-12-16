import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PeopleScreen } from "@features/People/screens/PeopleScreen";
import { PersonDetailScreen } from "@features/PersonDetail/screens/PersonDetailScreen";
import { AddPersonScreen } from "@features/AddPerson/screens/AddPersonScreen";
import { AddRelationScreen } from "@features/AddRelation/screens/AddRelationScreen";
import { PersonDetailEditScreen } from "@features/PersonDetail/screens/PersonDetailEditScreen";
import { AddPersonFromContactsScreen } from "@features/AddPerson/screens/AddPersonFromContactsScreen";

export type PeopleStackParamList = {
    People: undefined,
    PersonDetail: { personId: string },
    AddPerson: undefined,
    AddPersonFromContacts: undefined,
    AddRelation: { sourcePersonId?: string } | undefined,
    PersonDetailEdit: { personId: string },
};

const Stack = createNativeStackNavigator<PeopleStackParamList>();

export const PeopleStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="People">

            <Stack.Screen name="People" component={PeopleScreen} />
            <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
            <Stack.Screen name="AddPerson" component={AddPersonScreen} />
            <Stack.Screen name="AddPersonFromContacts" component={AddPersonFromContactsScreen} />
            <Stack.Screen name="AddRelation" component={AddRelationScreen} />
            <Stack.Screen name="PersonDetailEdit" component={PersonDetailEditScreen} />
        </Stack.Navigator>
    )
}
