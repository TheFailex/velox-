import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export const initRevenueCat = async (userId?: string) => {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY!,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY!,
  })!;

  await Purchases.configure({ apiKey, appUserID: userId });
};

export const checkPremium = async (): Promise<boolean> => {
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active['velox_premium'] !== undefined;
};

export const restorePurchases = async () => {
  return await Purchases.restorePurchases();
};
