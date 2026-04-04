import { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'PlusJakartaSans-Bold',
  displaySemiBold: 'PlusJakartaSans-SemiBold',
  body: 'PlusJakartaSans',
} as const;

export type TypographyVariant =
  | 'displayLarge'
  | 'displaySmall'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button';

export const typography: Record<TypographyVariant, TextStyle> = {
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displaySmall: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  heading: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 28,
  },
  subheading: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
};
