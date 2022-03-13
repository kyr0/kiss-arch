import { getGlobal, setGlobal } from './global'

export interface GetSetStorage extends Partial<Storage> {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const getMockStorage = (identifier: string): GetSetStorage => {
  return {
    getItem: (key: string) => getGlobal<any>(identifier)[key],
    setItem: (key: string, value: string) => {
      const store = getGlobal<any>(identifier)
      store[key] = value
      return store[key]
    },
  }
}

export const getSessionStorage = (identifier: string) => {
  try {
    return sessionStorage
  } catch (e) {
    // can throw SecurityException
    return getMockStorage(identifier)
  }
}

export const getLocalStorage = (identifier: string) => {
  try {
    return localStorage
  } catch (e) {
    // can throw SecurityException
    return getMockStorage(identifier)
  }
}

export interface StoreApi<T> {
  state: T
  get(key: keyof T, defaultValue?: T[keyof T]): T[keyof T] | undefined
  set(key: keyof T, value: T[keyof T]): StoreApi<T>
  load(key: keyof T, defaultValue?: T[keyof T]): StoreApi<T>
  save(key: keyof T): StoreApi<T>
  loadForSession(key: keyof T, defaultValue?: T[keyof T]): StoreApi<T>
  saveForSession(key: keyof T): StoreApi<T>
}

export const persist = <T>(key: keyof T, api: GetSetStorage, store: StoreApi<T>) => {
  api.setItem(key as string, JSON.stringify(store.state[key]))
  return store
}

export const restore = <T>(key: keyof T, store: StoreApi<T>, api: GetSetStorage, defaultValue?: T[keyof T]) => {
  store.set(key, JSON.parse(api.getItem(key as string) || '""') || defaultValue)
}

export const getStore = <T>(identifier = '_STORE'): StoreApi<T> => {
  let STORE = getGlobal<StoreApi<T>>(identifier)

  if (STORE) return STORE

  STORE = setGlobal<StoreApi<T>>(identifier, {
    state: {} as T,
    get: (key: keyof T, defaultValue?: T[keyof T]) =>
      typeof STORE.state[key] === 'undefined' ? defaultValue : STORE.state[key],
    set: (key: keyof T, value: T[keyof T]) => {
      STORE.state[key] = value
      return STORE
    },
    load: (key: keyof T, defaultValue?: T[keyof T]) => {
      restore(key, STORE, getLocalStorage(identifier), defaultValue)
      return STORE
    },
    save: (key: keyof T) => persist(key, getLocalStorage(identifier), STORE),
    loadForSession: (key: keyof T, defaultValue?: T[keyof T]) => {
      restore(key, STORE, getSessionStorage(identifier), defaultValue)
      return STORE
    },
    saveForSession: (key: keyof T) => persist(key, getSessionStorage(identifier), STORE),
  })
  return STORE
}
