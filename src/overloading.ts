// credits goes to https://stackoverflow.com/a/50375286
// function intersection producec - functin overloads
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
export type IsNever<T> = [T] extends [UnionToIntersection<T>] ? true : false

export type Values<T> = T[keyof T]

/**
 * Generate all possible combinations of allowed arguments
 */
export type AllOverloads<Mappings, Keys extends string> = {
  [Prop in Keys]: Prop extends keyof Mappings ? (key: Prop, data: Mappings[Prop]) => any : (key: Prop) => any
}

/**
 * Convert all allowed combinations to function overload
 */
export type Overloading<Mappings, Keys extends string> = keyof Mappings extends Keys
  ? UnionToIntersection<Values<AllOverloads<Mappings, Keys>>>
  : never
