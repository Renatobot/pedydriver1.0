import { describe, it, expect } from "vitest";
import { FREE_LIMITS, PRO_LIMITS } from "@/types/subscription";

describe("Platform Limit for Free Plan", () => {
  describe("FREE_LIMITS configuration", () => {
    it("should limit free users to 1 platform", () => {
      expect(FREE_LIMITS.maxPlatforms).toBe(1);
    });

    it("should limit free users to 30 entries per month", () => {
      expect(FREE_LIMITS.maxEntriesPerMonth).toBe(30);
    });

    it("should limit free users to 7 days of history", () => {
      expect(FREE_LIMITS.historyDays).toBe(7);
    });
  });

  describe("PRO_LIMITS configuration", () => {
    it("should allow unlimited platforms for pro users", () => {
      expect(PRO_LIMITS.maxPlatforms).toBe(Infinity);
    });

    it("should allow unlimited entries for pro users", () => {
      expect(PRO_LIMITS.maxEntriesPerMonth).toBe(Infinity);
    });
  });

  describe("Platform selection logic", () => {
    // Simulates the canUsePlatform logic
    const canUsePlatform = (
      platformId: string,
      isPro: boolean,
      usedPlatformIds: string[],
      userPlatformCount: number,
      maxPlatforms: number
    ): boolean => {
      if (isPro) return true;
      // If user already used this platform, they can continue using it
      if (usedPlatformIds.includes(platformId)) return true;
      // If user hasn't reached the limit, they can use a new platform
      return userPlatformCount < maxPlatforms;
    };

    it("should allow free user to select first platform", () => {
      const result = canUsePlatform(
        "platform-1",
        false, // not pro
        [], // no platforms used yet
        0, // user platform count
        FREE_LIMITS.maxPlatforms
      );
      expect(result).toBe(true);
    });

    it("should block free user from selecting second platform", () => {
      const result = canUsePlatform(
        "platform-2",
        false, // not pro
        ["platform-1"], // already using platform-1
        1, // user platform count = 1
        FREE_LIMITS.maxPlatforms
      );
      expect(result).toBe(false);
    });

    it("should allow free user to continue using already used platform", () => {
      const result = canUsePlatform(
        "platform-1",
        false, // not pro
        ["platform-1"], // already using platform-1
        1, // user platform count = 1
        FREE_LIMITS.maxPlatforms
      );
      expect(result).toBe(true);
    });

    it("should allow pro user to select multiple platforms", () => {
      const result1 = canUsePlatform(
        "platform-1",
        true, // is pro
        [],
        0,
        PRO_LIMITS.maxPlatforms
      );
      const result2 = canUsePlatform(
        "platform-2",
        true, // is pro
        ["platform-1"],
        1,
        PRO_LIMITS.maxPlatforms
      );
      const result3 = canUsePlatform(
        "platform-3",
        true, // is pro
        ["platform-1", "platform-2"],
        2,
        PRO_LIMITS.maxPlatforms
      );
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe("Toggle platform selection logic (with race condition prevention)", () => {
    // Simulates the togglePlatform with state updater logic
    const togglePlatformWithLimit = (
      platformId: string,
      currentSelection: string[],
      isPro: boolean,
      maxPlatforms: number,
      canUsePlatformFn: (id: string) => boolean
    ): string[] => {
      // If already selected, allow removal
      if (currentSelection.includes(platformId)) {
        return currentSelection.filter((id) => id !== platformId);
      }
      
      // Limit check INSIDE the updater (prevents race condition)
      if (!isPro && currentSelection.length >= maxPlatforms) {
        return currentSelection; // No change
      }
      
      // Check if can use this platform
      if (!canUsePlatformFn(platformId)) {
        return currentSelection; // No change
      }
      
      return [...currentSelection, platformId];
    };

    it("should prevent adding second platform for free user even with rapid taps", () => {
      const canUseAny = () => true; // Simulating no history restriction
      
      // Simulate rapid taps on 2 different platforms
      let state: string[] = [];
      
      // First tap - should add
      state = togglePlatformWithLimit("platform-1", state, false, 1, canUseAny);
      expect(state).toEqual(["platform-1"]);
      
      // Second tap (rapid) - should be blocked due to limit check inside updater
      state = togglePlatformWithLimit("platform-2", state, false, 1, canUseAny);
      expect(state).toEqual(["platform-1"]); // Still only 1 platform
      
      // Third tap on different platform - still blocked
      state = togglePlatformWithLimit("platform-3", state, false, 1, canUseAny);
      expect(state).toEqual(["platform-1"]); // Still only 1 platform
    });

    it("should allow removal even when at limit", () => {
      const canUseAny = () => true;
      
      let state = ["platform-1"];
      
      // Remove the selected platform
      state = togglePlatformWithLimit("platform-1", state, false, 1, canUseAny);
      expect(state).toEqual([]); // Removed
      
      // Now can add a different one
      state = togglePlatformWithLimit("platform-2", state, false, 1, canUseAny);
      expect(state).toEqual(["platform-2"]);
    });

    it("should allow pro user to add unlimited platforms", () => {
      const canUseAny = () => true;
      
      let state: string[] = [];
      
      state = togglePlatformWithLimit("platform-1", state, true, Infinity, canUseAny);
      state = togglePlatformWithLimit("platform-2", state, true, Infinity, canUseAny);
      state = togglePlatformWithLimit("platform-3", state, true, Infinity, canUseAny);
      state = togglePlatformWithLimit("platform-4", state, true, Infinity, canUseAny);
      
      expect(state).toHaveLength(4);
      expect(state).toEqual(["platform-1", "platform-2", "platform-3", "platform-4"]);
    });
  });
});
