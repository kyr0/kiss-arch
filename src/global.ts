export const getGlobal = <T>(identifier: string): T => (globalThis as any)[identifier]

export const setGlobal = <T>(identifier: string, value: T): T => {
  ;(globalThis as any)[identifier] = value
  return (globalThis as any)[identifier]
}
