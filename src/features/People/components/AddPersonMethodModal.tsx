import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { Button, Text } from '@components/index';
import { useTranslation } from 'react-i18next';

interface AddPersonMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFromContacts: () => void;
  onSelectManual: () => void;
}

export const AddPersonMethodModal = ({
  visible,
  onClose,
  onSelectFromContacts,
  onSelectManual,
}: AddPersonMethodModalProps) => {
  const { t } = useTranslation();

  const handleFromContacts = () => {
    onSelectFromContacts();
    onClose();
  };

  const handleManual = () => {
    onSelectManual();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="w-4/5 rounded-2xl bg-background p-6">
          <View className="mb-4">
            <Text
              text={t('people.addPersonModal.title')}
              type="title4"
              className="text-text"
            />
          </View>
          <View className="gap-3">
            <Button
              text={t('people.addPersonModal.fromContacts')}
              onPress={handleFromContacts}
            />
            <Button
              text={t('people.addPersonModal.manual')}
              onPress={handleManual}
            />
            <Button
              text={t('common.cancel')}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

