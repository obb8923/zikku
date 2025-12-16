import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBar, Background, Property, Text } from '@components/index';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { usePersonStore } from '@stores/personStore';
import { useRelationStore } from '@stores/relationStore';
import PeopleIcon from '@assets/svgs/People.svg';
import { useColors } from '@shared/hooks/useColors';
type PersonDetailScreenRouteProp = RouteProp<PeopleStackParamList, 'PersonDetail'>;
type PersonDetailScreenNavigationProp = NativeStackNavigationProp<PeopleStackParamList, 'PersonDetail'>;


export const PersonDetailScreen = () => {
  const route = useRoute<PersonDetailScreenRouteProp>();
  const navigation = useNavigation<PersonDetailScreenNavigationProp>();
  const { personId } = route.params;
  const people = usePersonStore((state) => state.people);
  const updatePerson = usePersonStore((state) => state.updatePerson);
  const getRelationsByPersonId = useRelationStore((state) => state.getRelationsByPersonId);
  const { t } = useTranslation();
  const colors = useColors();
  const person = useMemo(() => {
    return people.find((p) => p.id === personId);
  }, [people, personId]);

  const relations = useMemo(() => {
    return getRelationsByPersonId(personId);
  }, [getRelationsByPersonId, personId]);

  const handleRemovePropertyValue = (propertyId: string, valueIndex: number) => {
    if (!person) return;

    const updatedProperties = person.properties.map((prop) => {
      if (prop.id === propertyId) {
        return {
          ...prop,
          values: prop.values.filter((_, i) => i !== valueIndex),
        };
      }
      return prop;
    });

    updatePerson(personId, { properties: updatedProperties });
  };

  if (!person) {
    return (
      <Background isTabBarGap={false}>
        <AppBar title={t('personDetail.title')} onLeftPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-4">
          <Text text={t('personDetail.notFound')} type="body1" className="text-text" />
        </View>
      </Background>
    );
  }

  const handleAddRelation = () => {
    navigation.navigate('AddRelation', { sourcePersonId: personId });
  };

  return (
    <Background isTabBarGap={false}>
      <AppBar
        title={t('personDetail.title')}
        onLeftPress={() => navigation.goBack()}
        onRightPress={() => navigation.navigate('PersonDetailEdit', { personId })}
        onRightText={t('personDetail.actions.edit')}
      />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}>
        {/* 이름 - 큰 제목 */}
        <View className="mb-8">
          <Text text={person.name} type="title1" className="text-text" />
        </View>

        {/* Properties 섹션 */}
        <View>
          {(person.properties || []).map((property) => (
            <Property
              key={property.id}
              property={property}
              readOnly={true}
              onRemoveValue={(valueIndex) => handleRemovePropertyValue(property.id, valueIndex)}
            />
          ))}
        </View>
        {/* 메모 섹션 */}
        {person.memo ? (
          <>
            <View className="border-b border-border  my-6" />
            <View className="flex-1">
              <Text text={person.memo} type="body2" className="text-text" />
            </View>
          </>
        ) : null}
        {/* 관계 섹션 */}
        {relations.length > 0 && (
          <>
            <View className="border-b border-border  my-6" />

            <View className="flex-row items-center mb-2" style={{ height: 18 }}>
              <View className="mr-1 justify-end items-center" style={{ width: 18, height: 18 }}>
                <PeopleIcon width={15} height={15} color={colors.TEXT_2} />
              </View>
              <Text text={t('personDetail.relationSection')} type="body3" className="text-text-2 font-semibold mr-8" style={{ lineHeight: Platform.OS === 'ios' ? 18 : 18 }} />
              <TouchableOpacity onPress={handleAddRelation}>
                <Text text={t('people.actions.addRelation')} type="body3" className="text-text-2 font-semibold underline" style={{ lineHeight: Platform.OS === 'ios' ? 18 : 18 }} />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              {relations.map((relation) => {
                const relatedPersonId = relation.sourcePersonId === personId
                  ? relation.targetPersonId
                  : relation.sourcePersonId;
                const relatedPerson = people.find((p) => p.id === relatedPersonId);

                if (!relatedPerson) return null;

                return (
                  <TouchableOpacity
                    key={relation.id}
                    className="mb-3 py-2"
                    activeOpacity={0.7}
                    onPress={() => {
                      navigation.push('PersonDetail', { personId: relatedPersonId });
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text text={relatedPerson.name} type="body1" className="text-text mb-1" />
                        {relation.description && (
                          <Text text={relation.description} type="body2" className="text-text-2" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Background>
  );
};