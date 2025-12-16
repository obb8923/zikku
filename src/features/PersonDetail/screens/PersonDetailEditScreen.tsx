import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';

import { AppBar, Background, Property, Text, Button } from '@components/index';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { usePersonStore } from '@stores/personStore';
import { PropertyType, PropertyValues } from '@/shared/types/personType';
import { AddPropertyModal } from '@features/AddPerson/components/AddPropertyModal';
import { PlusButton } from '@features/AddPerson/components/PlusButton';
import { useColors } from '@shared/hooks/useColors';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import { logEvent } from '@services/analytics';
type PersonDetailEditRouteProp = RouteProp<PeopleStackParamList, 'PersonDetailEdit'>;
type PersonDetailEditNavigationProp = NativeStackNavigationProp<
  PeopleStackParamList,
  'PersonDetailEdit'
>;

const cloneProperties = (properties: PropertyType[]): PropertyType[] => {
  return properties.map((property) => ({
    ...property,
    values: [...property.values],
  }));
};

export const PersonDetailEditScreen = () => {
  const route = useRoute<PersonDetailEditRouteProp>();
  const navigation = useNavigation<PersonDetailEditNavigationProp>();
  const { personId } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isSubscribed = useSubscriptionStore((s) => s.subscriptionInfo.isSubscribed);
  const people = usePersonStore((state) => state.people);
  const updatePerson = usePersonStore((state) => state.updatePerson);
  const deletePerson = usePersonStore((state) => state.deletePerson);

  const person = useMemo(() => people.find((p) => p.id === personId), [people, personId]);

  const [name, setName] = useState(person?.name ?? '');
  const [properties, setProperties] = useState<PropertyType[]>(cloneProperties(person?.properties || []));
  const [memo, setMemo] = useState(
    isSubscribed ? person?.memo ?? '' : person?.memo?.slice(0, 300) ?? '',
  );
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setProperties(cloneProperties(person.properties));
      setMemo(isSubscribed ? person.memo ?? '' : person.memo?.slice(0, 300) ?? '');
    }
  }, [person, isSubscribed]);

  const handleUpdateProperty = (updatedProperty: PropertyType) => {
    setProperties((prev) => prev.map((prop) => (prop.id === updatedProperty.id ? updatedProperty : prop)));
  };

  const handleAddProperty = (type: PropertyValues) => {
    const newProperty: PropertyType = {
      id: uuid.v4() as string,
      type,
      values: [],
      ...(type === 'custom' ? { customLabel: t('property.labels.custom') } : {}),
    };
    setProperties((prev) => [...prev, newProperty]);
  };

  const handleSave = async () => {
    if (!person || !name.trim()) {
      return;
    }

    const cleanedProperties = properties
      .map((prop) => {
        if (prop.type === 'custom') {
          const trimmedValues = prop.values.map((v) => v.trim()).filter(Boolean);
          return trimmedValues.length > 0 ? { ...prop, values: trimmedValues } : null;
        }
        return prop;
      })
      .filter((prop): prop is PropertyType => !!prop);

    await updatePerson(personId, {
      name: name.trim(),
      properties: cleanedProperties,
      memo: isSubscribed ? memo.trim() : memo.trim().slice(0, 300),
    });
    logEvent('person_updated', {
      property_count: cleanedProperties.length,
      has_memo: Boolean(memo.trim()),
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      t('personDetail.edit.deleteTitle'),
      t('personDetail.edit.deleteDescription'),
      [
        {
          text: t('personDetail.edit.deleteCancel'),
          style: 'cancel',
        },
        {
          text: t('personDetail.edit.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            await deletePerson(personId);
            logEvent('person_deleted', { reason: 'manual' });
            navigation.navigate('People');
          },
        },
      ],
    );
  };

  if (!person) {
    return (
      <Background isTabBarGap={false}>
        <AppBar
          title={t('personDetail.edit.title')}
          onLeftPress={() => navigation.goBack()}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text text={t('personDetail.notFound')} type="body1" className="text-text" />
        </View>
      </Background>
    );
  }

  const existingPropertyTypes = properties.map((p) => p.type);

  return (
    <Background isTabBarGap={false}>
      <AppBar
        title={t('personDetail.edit.title')}
        onLeftPress={() => navigation.goBack()}
        onRightPress={handleDelete}
        onRightText={t('personDetail.actions.delete')}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('addPerson.namePlaceholder')}
              placeholderTextColor={colors.TEXT_2}
              className="text-text"
              style={{
                fontFamily: 'NotoSansKR-SemiBold',
                fontSize: 28,
                lineHeight: 28 * 1.4,
              }}
            />
          </View>

          <View className="mb-6">
            {properties.map((property) => (
              <Property
                key={property.id}
                property={property}
                onUpdate={handleUpdateProperty}
              />
            ))}
            <View className="h-6 w-full items-start">
              <PlusButton text={t('addPerson.addProperty')} onPress={() => setShowAddPropertyModal(true)} />
            </View>
          </View>

          <View className="border-b border-border" />

          <View className="my-6">
            <View className="mb-2 flex-row justify-end">
              <Text
                text={isSubscribed ? `${memo.length}` : `${memo.length}/300`}
                type="caption1"
                className="text-text-2"
              />
            </View>
            <TextInput
              value={memo}
              onChangeText={(text) => setMemo(isSubscribed ? text : text.slice(0, 300))}
              placeholder={t('addPerson.memoPlaceholder')}
              placeholderTextColor={colors.TEXT_2}
              maxLength={isSubscribed ? undefined : 300}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="rounded-lg px-4 py-3 text-text"
              style={{
                fontFamily: 'NotoSansKR-Medium',
                fontSize: 16,
                minHeight: 120,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
                includeFontPadding: false,
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AddPropertyModal
        visible={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSelect={handleAddProperty}
        existingTypes={existingPropertyTypes}
        canUseCustom={isSubscribed}
      />

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 justify-center items-center"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Button text={t('personDetail.actions.save')} onPress={handleSave} />
      </View>
    </Background>
  );
};

