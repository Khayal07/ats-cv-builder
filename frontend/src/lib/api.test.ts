import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, API_URL, scoreResume } from "./api";
import { emptyResume } from "./resume/defaults";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (...args: Parameters<typeof fetch>) => Promise<Response>) {
  const mock = vi.fn(impl);
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("scoreResume", () => {
  it("posts the resume and job description as snake_case JSON", async () => {
    const result = { score: 50, matched: [], missing: [], suggestions: [] };
    const fetchMock = stubFetch(async () => new Response(JSON.stringify(result), { status: 200 }));

    await expect(scoreResume(emptyResume(), "Python")).resolves.toEqual(result);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/score`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ resume: emptyResume(), job_description: "Python" });
  });

  it("maps 422 to an invalid-input error", async () => {
    stubFetch(async () => new Response("{}", { status: 422 }));
    await expect(scoreResume(emptyResume(), "x")).rejects.toMatchObject({ kind: "invalid" });
  });

  it("maps 5xx to a server error", async () => {
    stubFetch(async () => new Response("oops", { status: 502 }));
    const error = await scoreResume(emptyResume(), "x").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe("server");
    expect(error.message).toContain("502");
  });

  it("maps fetch failures to a network error", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(scoreResume(emptyResume(), "x")).rejects.toMatchObject({ kind: "network" });
  });
});
