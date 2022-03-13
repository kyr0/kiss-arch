import { getMode, setMode } from '../mode'

it('returns production as the default mode', () => {
  expect(getMode()).toEqual('production')
})

it('can set and get the mode development', () => {
  setMode('development')
  expect(getMode()).toEqual('development')
})

it('can set and get the mode production', () => {
  setMode('production')
  expect(getMode()).toEqual('production')
})
