import React from 'react';
import { View, Platform, TextInput } from 'react-native';
import { Text } from '@components/Text';
import { PropertyValues, PropertyType } from '@/shared/types/personType';
import { ChipInput } from '../../features/AddPerson/components/ChipInput';
import { Chip } from '@components/Chip';
import TagIcon from '@assets/svgs/Tag.svg';
import GlobeIcon from '@assets/svgs/Globe.svg';
import PhoneIcon from '@assets/svgs/Phone.svg';
import CalendarIcon from '@assets/svgs/Calendar.svg';
import LikeIcon from '@assets/svgs/Like.svg';
import DisLikeIcon from '@assets/svgs/DisLike.svg';
import FaceIcon from '@assets/svgs/Face.svg';
import StarIcon from '@assets/svgs/Star.svg';
import { useTranslation } from 'react-i18next';
import { useColors } from '@shared/hooks/useColors';

interface PropertyProps {
  property: PropertyType;
  onUpdate?: (property: PropertyType) => void;
  readOnly?: boolean;
  onRemoveValue?: (valueIndex: number) => void;
}

export const getPropertyLabel = (type: PropertyValues, t: (key: string) => string): string => {
  return t(`property.labels.${type}`);
};

const getPropertyDisplayLabel = (
  property: PropertyType,
  t: (key: string) => string,
): string => {
  if (property.type === 'custom') {
    return property.customLabel?.trim() || getPropertyLabel('custom', t);
  }
  return getPropertyLabel(property.type, t);
};

export const getPropertyPlaceholder = (type: PropertyValues, t: (key: string) => string): string => {
  return t(`property.placeholders.${type}`);
};

export const getPropertyIcon = (type: PropertyValues): React.ComponentType<any> => {
  switch (type) {
    case 'tags':
      return TagIcon;
    case 'organizations':
      return GlobeIcon;
    case 'phone':
      return PhoneIcon;
    case 'birthday':
      return CalendarIcon;
    case 'likes':
      return LikeIcon;
    case 'dislikes':
      return DisLikeIcon;
    case 'personality':
      return FaceIcon;
    case 'custom':
      return StarIcon;
    default:
      return () => <Text text="•" type="body1" />;
  }
};

export const Property = ({ property, onUpdate, readOnly = false, onRemoveValue: _onRemoveValue }: PropertyProps) => {
  const { t } = useTranslation();
  const colors = useColors();
  const handleChipChange = (values: string[]) => {
    if (onUpdate) {
      onUpdate({ ...property, values });
    }
  };

  const variant = property.type === 'tags' ? 'light' : 'default';

  const IconComponent = getPropertyIcon(property.type);
  const headerHeight = 18;
  const iconWidth = headerHeight - 3;
  const displayLabel = getPropertyDisplayLabel(property, t);

  // 읽기 전용 모드
  if (readOnly) {
    const hasValues = property.values.length > 0;
    if (!hasValues) {
      return null;
    }

    return (
      <View className="mb-4">
        <View className="flex-row items-center mb-2" style={{ height: headerHeight }}>
          <View className="mr-1 justify-end items-center" style={{ width: headerHeight, height: headerHeight }}>
            <IconComponent width={iconWidth} height={iconWidth} color={colors.TEXT_2} />
          </View>
          <Text
            text={displayLabel}
            type="body3"
            className="text-text-2 font-semibold"
            style={{ lineHeight: Platform.OS === 'ios' ? headerHeight : 18 }}
          />
        </View>
        <View className="flex-row flex-wrap gap-2">
          {property.values.map((value, index) => (
            <Chip
              key={index}
              label={value}
              onRemove={undefined}
              variant={variant}
            />
          ))}
        </View>
      </View>
    );
  }

  // 편집 모드
  return (
    <View className="mb-6 border-b border-border pb-2">
      {/* Icon & Label & Action Button */}
      <View className="flex-row items-center mb-2" style={{ height: headerHeight }}>
        <View className="mr-1 justify-end items-center" style={{ width: headerHeight, height: headerHeight }}>
          <IconComponent width={iconWidth} height={iconWidth} color={colors.TEXT_2} />
        </View>
          {property.type === 'custom' && onUpdate ? (
            <TextInput
              value={property.customLabel ?? ''}
              onChangeText={(text) => onUpdate({ ...property, customLabel: text })}
              placeholder={getPropertyLabel('custom', t)}
              placeholderTextColor={colors.TEXT_2}
              className="flex-1 text-text"
              style={{
                fontFamily: 'NotoSansKR-SemiBold',
                fontSize: 14,
                lineHeight: Platform.OS === 'ios' ? headerHeight : 18,
                includeFontPadding: false,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
            />
          ) : (
            <Text
              text={displayLabel}
              type="body3"
              className="text-text-2 font-semibold"
              style={{ lineHeight: Platform.OS === 'ios' ? headerHeight : 18 }}
            />
          )}
      </View>

      <View>
        <ChipInput
          values={property.values}
          onChange={handleChipChange}
          placeholder={getPropertyPlaceholder(property.type, t)}
          variant={variant}
        />
      </View>
    </View>
  );
};

