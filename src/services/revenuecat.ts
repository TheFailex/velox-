import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export const initRevenueCat = async (userId?: string) => {
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  });

  if (!apiKey || apiKey.trim() === '') return;

  Purchases.setLogLevel(LOG_LEVEL.ERROR);

  try {
    Purchases.configure({ apiKey, appUserID: userId });
  } catch (e) {
    console.error('[Velox] RevenueCat init failed:', e);
    if (__DEV__) throw e;
  }
};

export const checkPremium = async (): Promise<boolean> => {
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active['velox_premium_v2'] !== undefined;
};

export const restorePurchases = async () => {
  return await Purchases.restorePurchases();
};
