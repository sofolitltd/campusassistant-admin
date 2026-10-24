// In-memory stash of client-fetched page data, so going back to a page shows
// what it last had instantly while it refetches in the background. Lives for
// the browser tab's session; a full reload starts empty.

const store = new Map<string, unknown>()

export function getCached<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function setCached<T>(key: string, value: T) {
  store.set(key, value)
}
