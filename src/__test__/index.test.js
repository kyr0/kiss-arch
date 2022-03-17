const kissArch = require('../../index')

it('declares the mode API / CommonJS', () => {
  expect(kissArch.getMode).toBeInstanceOf(Function)
  expect(kissArch.setMode).toBeInstanceOf(Function)
})

it('declares the global API / CommonJS', () => {
  expect(kissArch.setGlobal).toBeInstanceOf(Function)
  expect(kissArch.getGlobal).toBeInstanceOf(Function)
})

it('declares the store API / CommonJS', () => {
  expect(kissArch.getStore).toBeInstanceOf(Function)
})

it('declares the bus API / CommonJS', () => {
  expect(kissArch.getBus).toBeInstanceOf(Function)
})

it('declares the CQRS API / CommonJS', () => {
  expect(kissArch.addCommand).toBeInstanceOf(Function)
  expect(kissArch.runCommand).toBeInstanceOf(Function)
})

it('declares the i18n / CommonJS', () => {
  expect(kissArch.t).toBeInstanceOf(Function)
  expect(kissArch.changeLanguage).toBeInstanceOf(Function)
  expect(kissArch.setTranslations).toBeInstanceOf(Function)
})
