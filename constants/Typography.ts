import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

export const Typography = {
  // Headings — use Nunito
  displayLarge:  { fontFamily: 'Nunito_800ExtraBold', fontSize: 32 },
  displayMedium: { fontFamily: 'Nunito_700Bold',      fontSize: 26 },
  headingLarge:  { fontFamily: 'Nunito_700Bold',      fontSize: 22 },
  headingMedium: { fontFamily: 'Nunito_600SemiBold',  fontSize: 18 },
  headingSmall:  { fontFamily: 'Nunito_600SemiBold',  fontSize: 15 },
  // Body — use Plus Jakarta Sans
  bodyLarge:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 },
  bodyMedium:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  bodySmall:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  bodyBold:      { fontFamily: 'PlusJakartaSans_700Bold',    fontSize: 14 },
  label:         { fontFamily: 'PlusJakartaSans_500Medium',  fontSize: 12 },
  caption:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11 },
  // Numbers / Data
  dataLarge:     { fontFamily: 'PlusJakartaSans_700Bold',    fontSize: 28 },
  dataMedium:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20 },
  dataSmall:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
};
