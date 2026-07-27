import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { usersService } from "./users";

/**
 * Best-effort registration of this device's Expo push token against the signed-in user.
 * Never throws — push is a nice-to-have, and it simply can't work on the iOS Simulator
 * (Apple push requires a physical device), so failures are swallowed and logged.
 */
export async function registerPushForUser(userId: number): Promise<void> {
  try {
    if (!Device.isDevice) {
      // Simulators/emulators can't obtain a real push token.
      return;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") {
      return;
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse?.data;
    if (token) {
      await usersService.registerPushToken(userId, token);
    }
  } catch (e) {
    console.warn("Push registration skipped:", (e as Error)?.message);
  }
}
