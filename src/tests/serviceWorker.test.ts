import { describe, it, expect, beforeEach } from "vitest";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// public/sw.js only ever runs in a real ServiceWorkerGlobalScope, so it is
// loaded here into a hand-rolled stand-in. The routing rules it encodes —
// network-first navigations, cache-first hashed assets, hands off anything
// cross-origin — are exactly the kind of thing that breaks without any local
// symptom and then strands an installed iPhone on a stale build.

const SW_SOURCE = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
const ORIGIN = "https://example.github.io";

interface FakeResponse {
  ok: boolean;
  type: string;
  body: string;
  clone: () => FakeResponse;
}

function makeResponse(body: string, init: { ok?: boolean; type?: string } = {}): FakeResponse {
  const response: FakeResponse = {
    ok: init.ok ?? true,
    type: init.type ?? "basic",
    body,
    clone: () => makeResponse(body, init)
  };
  return response;
}

function makeRequest(url: string, init: { method?: string; mode?: string } = {}) {
  return {
    url: new URL(url, `${ORIGIN}/app/`).href,
    method: init.method ?? "GET",
    mode: init.mode ?? "cors"
  };
}

type Listener = (event: Record<string, unknown>) => void;

function loadServiceWorker() {
  const listeners = new Map<string, Listener>();
  const caches_ = new Map<string, Map<string, FakeResponse>>();
  const fetchLog: string[] = [];
  let fetchImpl: (url: string) => Promise<FakeResponse> = (url) =>
    Promise.resolve(makeResponse(`network:${url}`));

  const keyOf = (req: unknown) =>
    typeof req === "string" ? new URL(req, `${ORIGIN}/app/`).href : (req as { url: string }).url;

  const cacheStorage = {
    open: (name: string) =>
      Promise.resolve({
        put: (req: unknown, res: FakeResponse) => {
          if (!caches_.has(name)) caches_.set(name, new Map());
          caches_.get(name)!.set(keyOf(req), res);
          return Promise.resolve();
        }
      }),
    match: (req: unknown) => {
      const key = keyOf(req);
      for (const cache of caches_.values()) {
        if (cache.has(key)) return Promise.resolve(cache.get(key));
      }
      return Promise.resolve(undefined);
    },
    keys: () => Promise.resolve([...caches_.keys()]),
    delete: (name: string) => Promise.resolve(caches_.delete(name))
  };

  const sandbox: Record<string, unknown> = {
    URL,
    Promise,
    console,
    caches: cacheStorage,
    fetch: (req: unknown) => {
      const url = keyOf(req);
      fetchLog.push(url);
      return fetchImpl(url);
    },
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    skipWaiting: () => undefined,
    clients: { claim: () => undefined },
    location: { origin: ORIGIN },
    __SW_BUILD_ID__: "testbuild",
    __SW_PRECACHE_MANIFEST__: ["./assets/index-abc123.js"]
  };
  sandbox.self = sandbox;

  vm.runInNewContext(SW_SOURCE, sandbox);

  /** Dispatches a fetch event and resolves what the worker responded with, or `null` if it declined. */
  async function dispatchFetch(request: ReturnType<typeof makeRequest>) {
    let responded: Promise<FakeResponse | undefined> | null = null;
    listeners.get("fetch")!({
      request,
      respondWith: (value: Promise<FakeResponse | undefined>) => {
        responded = value;
      }
    });
    return responded === null ? null : ((await responded) ?? null);
  }

  async function dispatchLifecycle(type: "install" | "activate") {
    const waits: Promise<unknown>[] = [];
    listeners.get(type)!({ waitUntil: (p: Promise<unknown>) => waits.push(p) });
    await Promise.all(waits);
  }

  return {
    dispatchFetch,
    dispatchLifecycle,
    fetchLog,
    caches: caches_,
    cacheNames: () => [...caches_.keys()],
    seed(cacheName: string, url: string, body: string) {
      if (!caches_.has(cacheName)) caches_.set(cacheName, new Map());
      caches_.get(cacheName)!.set(new URL(url, `${ORIGIN}/app/`).href, makeResponse(body));
    },
    setFetch(impl: (url: string) => Promise<FakeResponse>) {
      fetchImpl = impl;
    }
  };
}

const CACHE = "aamva-pdf417-testbuild";

describe("service worker install", () => {
  it("precaches the app shell, the injected asset manifest, and the iOS icon", async () => {
    const sw = loadServiceWorker();
    await sw.dispatchLifecycle("install");

    const cached = [...sw.caches.get(CACHE)!.keys()].map((u) => u.replace(`${ORIGIN}/app/`, "./"));
    expect(cached).toContain("./index.html");
    expect(cached).toContain("./manifest.webmanifest");
    expect(cached).toContain("./assets/index-abc123.js");
    expect(cached).toContain("./icons/apple-touch-icon.png");
  });

  it("survives a 404 on one shell entry", async () => {
    const sw = loadServiceWorker();
    sw.setFetch((url) =>
      url.endsWith("manifest.webmanifest")
        ? Promise.resolve(makeResponse("missing", { ok: false }))
        : Promise.resolve(makeResponse("ok"))
    );
    await sw.dispatchLifecycle("install");

    const cached = [...sw.caches.get(CACHE)!.keys()];
    expect(cached.some((u) => u.endsWith("index.html"))).toBe(true);
    expect(cached.some((u) => u.endsWith("manifest.webmanifest"))).toBe(false);
  });
});

describe("service worker activate", () => {
  it("drops caches from previous builds and keeps the current one", async () => {
    const sw = loadServiceWorker();
    sw.seed("aamva-pdf417-oldbuild", "./index.html", "stale");
    sw.seed(CACHE, "./index.html", "fresh");

    await sw.dispatchLifecycle("activate");

    expect(sw.cacheNames()).toEqual([CACHE]);
  });
});

describe("service worker fetch routing", () => {
  let sw: ReturnType<typeof loadServiceWorker>;

  beforeEach(() => {
    sw = loadServiceWorker();
  });

  it("serves navigations from the network even when a cached shell exists", async () => {
    sw.seed(CACHE, "./index.html", "old-shell");
    sw.setFetch(() => Promise.resolve(makeResponse("new-shell")));

    const response = await sw.dispatchFetch(makeRequest("./", { mode: "navigate" }));

    expect(response?.body).toBe("new-shell");
    expect(sw.fetchLog).toHaveLength(1);
  });

  it("refreshes the cached shell from a successful navigation", async () => {
    sw.seed(CACHE, "./index.html", "old-shell");
    sw.setFetch(() => Promise.resolve(makeResponse("new-shell")));

    await sw.dispatchFetch(makeRequest("./", { mode: "navigate" }));
    await Promise.resolve();

    expect(sw.caches.get(CACHE)!.get(`${ORIGIN}/app/index.html`)?.body).toBe("new-shell");
  });

  it("falls back to the cached shell when the network is gone", async () => {
    sw.seed(CACHE, "./index.html", "offline-shell");
    sw.setFetch(() => Promise.reject(new Error("offline")));

    const response = await sw.dispatchFetch(makeRequest("./", { mode: "navigate" }));

    expect(response?.body).toBe("offline-shell");
  });

  it("serves hashed assets from cache without touching the network", async () => {
    sw.seed(CACHE, "./assets/index-abc123.js", "cached-bundle");

    const response = await sw.dispatchFetch(makeRequest("./assets/index-abc123.js"));

    expect(response?.body).toBe("cached-bundle");
    expect(sw.fetchLog).toHaveLength(0);
  });

  it("fetches and caches an asset it has not seen", async () => {
    sw.setFetch(() => Promise.resolve(makeResponse("fresh-bundle")));

    const response = await sw.dispatchFetch(makeRequest("./assets/late-chunk.js"));
    await Promise.resolve();

    expect(response?.body).toBe("fresh-bundle");
    expect(sw.caches.get(CACHE)!.get(`${ORIGIN}/app/assets/late-chunk.js`)?.body).toBe(
      "fresh-bundle"
    );
  });

  it("does not cache opaque or failed responses", async () => {
    sw.setFetch(() => Promise.resolve(makeResponse("opaque", { type: "opaque" })));
    await sw.dispatchFetch(makeRequest("./assets/a.js"));

    sw.setFetch(() => Promise.resolve(makeResponse("404", { ok: false })));
    await sw.dispatchFetch(makeRequest("./assets/b.js"));
    await Promise.resolve();

    expect(sw.caches.get(CACHE)).toBeUndefined();
  });

  it("declines cross-origin and non-GET requests", async () => {
    expect(await sw.dispatchFetch(makeRequest("https://cdn.example.com/x.js"))).toBeNull();
    expect(await sw.dispatchFetch(makeRequest("./api", { method: "POST" }))).toBeNull();
    expect(sw.fetchLog).toHaveLength(0);
  });
});
