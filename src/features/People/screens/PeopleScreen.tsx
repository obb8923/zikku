import { useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Background, Button, ScreenHeader, TabBar, Text } from '@components/index';
import { usePersonStore } from '@stores/personStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { FlashList } from '@shopify/flash-list';
import { PersonType } from '@/shared/types/personType';
import { PeopleListHeader } from '@/features/People/components/PeopleListHeader';
import { useColors } from '@shared/hooks/useColors';
import AddPersonIcon from '@assets/svgs/AddPerson.svg';
import AddRelationIcon from '@assets/svgs/AddRelation.svg';
import { AdmobNative } from "@components/ads/AdmobNative";
import { AddPersonMethodModal } from '@/features/People/components/AddPersonMethodModal';
import { logEvent } from '@services/analytics';

type PeopleScreenNavigationProp = NativeStackNavigationProp<PeopleStackParamList, 'People'>;

export const PeopleScreen = () => {
  const navigation = useNavigation<PeopleScreenNavigationProp>();
  const people = usePersonStore((state) => state.people);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isAddPersonModalVisible, setIsAddPersonModalVisible] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const { t } = useTranslation();
  const colors = useColors();

  const defaultSelfName = t('common.defaultPersonName');
  const isSelfPerson = (person: PersonType) =>
    person.isSelf || person.name === defaultSelfName;

  const selfPerson = useMemo(
    () => people.find((person) => isSelfPerson(person)),
    [people, defaultSelfName],
  );

  const acquaintances = useMemo(
    () => people.filter((person) => !isSelfPerson(person)),
    [people, defaultSelfName],
  );

  const filteredPeople = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return acquaintances;
    }

    return acquaintances.filter((person) => {
      const matchesName = person.name.toLowerCase().includes(query);
      const matchesProperties = person.properties?.some((property) =>
        property.values?.some((value) =>
          value.toLowerCase().includes(query)
        )
      );

      return matchesName || matchesProperties;
    });
  }, [acquaintances, searchQuery]);

  const handleAddPerson = () => {
    setIsAddPersonModalVisible(true);
  };

  const handleAddPersonDirect = () => {
    logEvent('people_add_entrypoint', { method: 'manual' });
    navigation.navigate('AddPerson');
  };

  const handleAddPersonFromContacts = () => {
    logEvent('people_add_entrypoint', { method: 'contacts' });
    navigation.navigate('AddPersonFromContacts');
  };

  const handleAddRelation = () => {
    navigation.navigate('AddRelation');
  };

  const handlePersonPress = (personId: string) => {
    logEvent('person_view', { person_id: personId });
    navigation.navigate('PersonDetail', { personId });
  };

  const renderPersonItem = ({ item,className }: { item: PersonType,className?: string }) => {
    return (
      <TouchableOpacity
        className={`px-8 py-2 mb-3 flex-row items-center justify-start ${className} ${
          pressedId === item.id ? 'bg-component-background' : ''
        }`}
        activeOpacity={0.7}
        onPress={() => {
          handlePersonPress(item.id);
        }}
        onPressIn={() => setPressedId(item.id)}
        onPressOut={() => setPressedId(null)}
      >
        <Text text={item.name} type="title4" className="text-text" numberOfLines={1} />
      </TouchableOpacity>
    );
  };

  return (
    <Background isTabBarGap={true}>
      <View className="flex-1">
        <ScreenHeader
          title={t('people.title')}
          rightContent={
            <View className="flex-row items-center justify-end gap-4">
              <TouchableOpacity onPress={handleAddPerson} className="flex-row items-center justify-center gap-1 ">
                <AddPersonIcon width={18} height={18} color={colors.TEXT} />
                <Text text={t('people.actions.addPersonShort')} type="body2" className="text-text" numberOfLines={1} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRelation} className="flex-row items-center justify-center gap-1">
                <AddRelationIcon width={18} height={18} color={colors.TEXT} />
                <Text text={t('people.actions.addRelation')} type="body2" className="text-text" numberOfLines={1} />
              </TouchableOpacity>
            </View>
          }
        />
        <FlashList
          data={filteredPeople}
          renderItem={renderPersonItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {selfPerson && renderPersonItem({ item: selfPerson, className: 'mb-0' })}
              <PeopleListHeader
                count={filteredPeople.length}
                searchQuery={searchQuery}
                isSearchVisible={isSearchVisible}
                onToggleSearch={() => setIsSearchVisible((prev) => !prev)}
                onChangeSearch={setSearchQuery}
              />
            </View>
          }
          ListEmptyComponent={
            <View className="px-8 py-10 items-center">
              {searchQuery.trim() ? (
                <Text text={t('people.empty.searchEmpty')} type="body1" className="text-text" />
              ) : (
                <>
                  <View className="items-center justify-center mb-6">
                    <Text text={t('people.empty.title')} type="title4" className="text-text" />
                    <Text text={t('people.empty.line1')} type="title4" className="text-text" />
                    <Text text={t('people.empty.line2')} type="title4" className="text-text" />
                  </View>
                  <Button text={t('people.actions.addPerson')} onPress={handleAddPerson} />
                </>
              )}
            </View>
          }
        />

      </View>
      <AddPersonMethodModal
        visible={isAddPersonModalVisible}
        onClose={() => setIsAddPersonModalVisible(false)}
        onSelectFromContacts={handleAddPersonFromContacts}
        onSelectManual={handleAddPersonDirect}
      />
      <AdmobNative />
      <TabBar />
    </Background>
  );
};
