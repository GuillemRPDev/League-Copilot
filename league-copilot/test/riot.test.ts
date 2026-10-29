import { describe, expect, it, jest } from "@jest/globals";

import { fetchAccountByRiotId, parseRiotId } from "../lib/riot";

describe("parseRiotId", () => {
  it("parses a Riot ID with a game name and tagline", () => {
    expect(parseRiotId("  Player Name#EUW ")).toEqual({
      gameName: "Player Name",
      tagLine: "EUW",
    });
  });

  it.each(["PlayerName", "#EUW", "PlayerName#", "Player#EU#W"])(
    "rejects malformed Riot ID %s",
    (riotId) => {
      expect(() => parseRiotId(riotId)).toThrow("Riot ID must follow the format name#tag");
    },
  );
});

describe("fetchAccountByRiotId", () => {
  it("uses the selected region for the account endpoint", async () => {
    process.env.RIOT_API_KEY = "test-key";
    const account = { puuid: "player-puuid", gameName: "Player Name", tagLine: "EUW" };
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => account,
    } as Response);
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });

    try {
      await expect(fetchAccountByRiotId("Player Name#EUW", "europe")).resolves.toEqual(account);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Player%20Name/EUW",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Riot-Token": "test-key" }),
        }),
      );
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, "fetch", { configurable: true, value: originalFetch });
      } else {
        Reflect.deleteProperty(globalThis, "fetch");
      }
    }
  });
});