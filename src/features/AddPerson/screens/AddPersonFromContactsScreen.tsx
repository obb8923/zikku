import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Background, AppBar, Text, SearchInput } from '@components/index';
import { useContactStore } from '@stores/contactStore';
import { usePersonStore } from '@stores/personStore';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { ContactMinimal } from '@shared/types/contactType';
import { useColors } from '@shared/hooks/useColors';
import { AdmobNative } from "@components/ads/AdmobNative";
import { logEvent } from '@services/analytics';
type NavigationProp = NativeStackNavigationProp<
  PeopleStackParamList,
  'AddPersonFromContacts'
>;

export const AddPersonFromContactsScreen = () => {
  console.log('[AddPersonFromContactsScreen] Component rendered');
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const colors = useColors();

  const { contacts, isLoading, error, loadContactsFromDevice } = useContactStore();
  console.log('[AddPersonFromContactsScreen] Store state:', { contactsCount: contacts?.length, isLoading, error });
  const addMultiplePeopleFromContacts = usePersonStore((state) => state.addMultiplePeopleFromContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('[AddPersonFromContactsScreen] useEffect triggered, calling loadContactsFromDevice');
    loadContactsFromDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const matchesName = contact.name.toLowerCase().includes(query);
      const matchesPhone = contact.phoneNumber.toLowerCase().includes(query);
      return matchesName || matchesPhone;
    });
  }, [contacts, searchQuery]);

  const handleToggleContact = (contactId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!filteredContacts || filteredContacts.length === 0) return;
    
    const allSelected = filteredContacts.every((contact) => selectedIds.has(contact.id));
    
    if (allSelected) {
      // 전체 선택 해제
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        filteredContacts.forEach((contact) => {
          newSet.delete(contact.id);
        });
        return newSet;
      });
    } else {
      // 전체 선택
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        filteredContacts.forEach((contact) => {
          newSet.add(contact.id);
        });
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    
    setIsSaving(true);
    
    try {
      const selectedContacts = filteredContacts.filter((contact) => selectedIds.has(contact.id));
      
      // 배치로 한 번에 저장
      await addMultiplePeopleFromContacts(
        selectedContacts.map((contact) => ({
          name: contact.name,
          phoneNumber: contact.phoneNumber,
        }))
      );
      logEvent('person_import_contacts', { count: selectedContacts.length });
      
      // People 화면으로 이동
      navigation.navigate('People');
    } catch (error) {
      console.error('Failed to save contacts:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: ContactMinimal }) => {
    const isSelected = selectedIds.has(item.id);
    
    return (
      <TouchableOpacity
        className="px-4 py-3 border-b border-border flex-row items-center"
        activeOpacity={0.7}
        onPress={() => handleToggleContact(item.id)}
      >
        <View
          className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
            isSelected ? 'bg-text border-text' : 'border-text-2'
          }`}
          style={{
            minWidth: 20,
            minHeight: 20,
          }}
        >
          {isSelected && (
            <Text 
              text="✓" 
              type="body2" 
              className="text-white font-bold"
              style={{ fontSize: 12, lineHeight: 12 }}
            />
          )}
        </View>
        <Text
          text={item.name}
          type="body1"
          className="text-text flex-1"
          numberOfLines={1}
        />
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.PRIMARY} />
          <View className="mt-4">
            <Text text={t('contacts.loading')} type="body1" className="text-text" />
          </View>
        </View>
      );
    }

    if (error === 'NO_PERMISSION') {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            text={t('contacts.noPermission')}
            type="body1"
            className="text-center text-text mb-4"
          />
        </View>
      );
    }

    if (!contacts || contacts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            text={t('contacts.empty')}
            type="body1"
            className="text-center text-text"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 py-8">
            <Text
              text={t('people.empty.searchEmpty')}
              type="body1"
              className="text-center text-text"
            />
          </View>
        }
      />
    );
  };

  return (
    <Background isTabBarGap={false}>
      <AppBar
        title={t('contacts.title')}
        onLeftPress={() => navigation.navigate('People')}
        onRightPress={selectedIds.size > 0 ? handleSave : undefined}
        onRightText={selectedIds.size > 0 ? t('contacts.save') : undefined}
      />
      <AdmobNative />
      {!isLoading && (
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center gap-2 mb-2">
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('common.searchPlaceholder')}
            />
            {/* {filteredContacts && filteredContacts.length > 0 && (
              <TouchableOpacity
                onPress={handleSelectAll}
                className="px-4 py-3 rounded-2xl bg-component-background border border-border"
                activeOpacity={0.7}
              >
                <Text
                  text={t('contacts.selectAll')}
                  type="body2"
                  className="text-text"
                />
              </TouchableOpacity>
            )} */}
          </View>
        </View>
      )}
      <View className="flex-1">{renderContent()}</View>
      
      {isSaving && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={isSaving}
          onRequestClose={() => {}}
        >
          <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="items-center justify-center bg-background px-8 py-2 rounded-xl">
              <ActivityIndicator size="large" color={colors.PRIMARY} />
              <View className="mt-4">
                <Text text={t('contacts.saving')} type="body1" className="text-text" />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Background>
  );
};


