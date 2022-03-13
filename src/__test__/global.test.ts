import { getGlobal, setGlobal } from '../global'

it('can set and get a global value', () => {
  interface FooBar {
    bar: number
  }

  // you're well advised to prefix any global variable
  // e.g. never use 'name', 'window', etc.
  const CACHE_FOO_NAME = 'myAppName_foo'

  // somewhere, e.g.a fetch() request loaded FooBar data from an HTTP endpoint
  // now we can cache it across files, scopes etc. easily
  setGlobal<FooBar>(CACHE_FOO_NAME, { bar: 123 })

  // somewhere else, e.g. in another file, read the data from the global cache
  const fooBar = getGlobal<FooBar>(CACHE_FOO_NAME)

  expect(fooBar).toEqual({ bar: 123 })
})

it('returns undefined for a previously unset global', () => {
  const fooBar = getGlobal<any>('foo2Undefined')
  expect(fooBar).toEqual(undefined)
})
