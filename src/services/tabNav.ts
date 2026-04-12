/**
 * Module-level holder for the (tabs) ScrollView scroll function.
 * GlobalTabBar calls navigateToTab(); (tabs)/_layout.tsx registers its goTo callback.
 */
let _goTo: ((idx: number) => void) | null = null;

export function registerTabGoTo(fn: (idx: number) => void): void {
  _goTo = fn;
}

export function unregisterTabGoTo(): void {
  _goTo = null;
}

export function navigateToTab(idx: number): void {
  _goTo?.(idx);
}
