/** SPEC_A3UI §8 declared fallbacks. MUST NOT crash. MUST NOT stay silent. */

export type Profile = "high-end" | "mid" | "blur-off" | "particles-off";

export type FallbackKind = "blur" | "haptic" | "permission" | "opengraph";

export type FallbackState = {
  kind: FallbackKind;
  message: string;
  visible: boolean;
};

export const BLUR_UNAVAILABLE = "blur unavailable";
export const HAPTIC_LIMITED = "haptic Mac limited";
export const PERMISSION_DENIED = "overlay disabled: overlay permission not granted";
export const OPENGRAPH_BLOCKED = "preview unavailable: OpenGraph blocked";

export function supportsBackdropFilter(css: typeof CSS | undefined = globalThis.CSS): boolean {
  return Boolean(css?.supports?.("backdrop-filter", "blur(4px)") || css?.supports?.("-webkit-backdrop-filter", "blur(4px)"));
}

export function blurFallback(profile: Profile, supported: boolean): FallbackState {
  return {
    kind: "blur",
    message: BLUR_UNAVAILABLE,
    visible: profile === "blur-off" || !supported,
  };
}

export function hapticFallback(available: boolean): FallbackState {
  return {
    kind: "haptic",
    message: HAPTIC_LIMITED,
    visible: !available,
  };
}

export function permissionFallback(granted: boolean): FallbackState {
  return {
    kind: "permission",
    message: PERMISSION_DENIED,
    visible: !granted,
  };
}

export function openGraphFallback(blocked: boolean): FallbackState {
  return {
    kind: "opengraph",
    message: OPENGRAPH_BLOCKED,
    visible: blocked,
  };
}

export function frostAllowed(profile: Profile, supported: boolean): boolean {
  return profile === "high-end" && supported;
}
