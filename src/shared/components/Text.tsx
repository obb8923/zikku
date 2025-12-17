import {Text as RNText, TextStyle} from 'react-native';

export type TypographyType = 
  | 'title1' | 'title2' | 'title3' | 'title4'
  | 'body1' | 'body2' | 'body3' 
  | 'caption1';

export type TextProps = {
    text: string;
    type?: TypographyType;
    className?: string;
    style?: TextStyle | TextStyle[];
    numberOfLines?: number;
  };

const NOTO_SANS_FONT_FAMILY = {
  medium: 'NotoSansKR-Medium',
  semibold: 'NotoSansKR-SemiBold',
} as const;

const getTypographyStyle = (type: TypographyType): TextStyle => {
  switch(type){
    case 'title1':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.semibold,
        fontSize: 28,
        lineHeight: 28 * 1.4,
        letterSpacing: -0.7, // -2.5%
      };
    case 'title2':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.semibold,
        fontSize: 26,
        lineHeight: 26 * 1.4,
        letterSpacing: -0.7,
      };
    case 'title3':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.semibold,
        fontSize: 22,
        lineHeight: 22 * 1.4,
        letterSpacing: -0.55,
      };
    case 'title4':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.semibold,
        fontSize: 18,
        lineHeight: 18 * 1.4,
        letterSpacing: -0.45,
      };
    case 'body1':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.medium,
        fontSize: 18,
        lineHeight: 18 * 1.4,
        letterSpacing: -0.45,
      };
    case 'body2':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.medium,
        fontSize: 16,
        lineHeight: 16 * 1.4,
        letterSpacing: -0.4,
      };
    case 'body3':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.medium,
        fontSize: 15,
        lineHeight: 15 * 1.4,
        letterSpacing: -0.375,
      };
    case 'caption1':
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.medium,
        fontSize: 12,
        lineHeight: 12 * 1.4,
        letterSpacing: -0.3,
      };
    default:
      return {
        fontFamily: NOTO_SANS_FONT_FAMILY.medium,
        fontSize: 16,
        lineHeight: 16 * 1.4,
        letterSpacing: -0.4,
      };
  }
}
export const Text = ({text, type='body2', ...props}: TextProps) => {
  const typographyStyle = getTypographyStyle(type);
  return (
    <RNText 
      {...props}
      className={props.className}
      style={[typographyStyle, props.style]}
      numberOfLines={props.numberOfLines}>
      {text}
    </RNText>
  );
};
