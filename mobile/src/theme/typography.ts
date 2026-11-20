export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typography = {
  display: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    lineHeight: 44,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
  },
  subheading: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 27,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 25,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
  },
} as const;
