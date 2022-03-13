import { getGlobal, setGlobal } from './global'

export type RuntimeMode = 'development' | 'production'

export const MODE_STORE = '_MODE'

export const getMode = (): RuntimeMode => {
  return (getGlobal<string>(MODE_STORE) as RuntimeMode) || 'production'
}

export const setMode = (mode: RuntimeMode) => {
  setGlobal<string>(MODE_STORE, mode)
}
