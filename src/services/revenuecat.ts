import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export const initRevenueCat = async (userId?: string) => {
  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  });

  // Skip initialization if no key configured — avoids 401 spam in logs
  if (!apiKey || apiKey.trim() === '') return;

  Purchases.setLogLevel(LOG_LEVEL.ERROR);

  try {
    Purchases.configure({ apiKey, appUserID: userId });
  } catch {
    // Silently fail — app works without RevenueCat (all users treated as free)
  }
};

export const checkPremium = async (): Promise<boolean> => {
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active['velox_premium'] !== undefined;
};

export const restorePurchases = async () => {
  return await Purchases.restorePurchases();
};
