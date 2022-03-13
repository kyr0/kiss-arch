import de from '../../test/de.json'
import en from '../../test/en.json'
import { changeLanguage, getLanguage, setTranslations, t, TFunction } from '../i18n'
import { setMode } from '../mode'

describe('i18n in english', () => {
  it('is defined', () => {
    expect(changeLanguage).toBeDefined()
    expect(getLanguage()).toEqual('en')
    expect(t).toBeInstanceOf(Function)
    expect(changeLanguage).toBeInstanceOf(Function)
    expect(setTranslations).toBeInstanceOf(Function)
  })

  it('translate test', () => {
    setTranslations(en, 'en')
    setTranslations(de, 'de')

    const tNs = t('ns') as TFunction

    changeLanguage('en')

    expect(t('Hello world')).toEqual('Hello world')
    expect(tNs('Max length {length}', { length: '10' })).toEqual('Max length 10')

    expect(
      tNs('I drove about {km} km per {period} with an {carType}.', { km: '10', period: 'week', carType: 'BMW' }),
    ).toEqual('I drove about 10 km per week with an BMW.')

    changeLanguage('de')

    expect(t('Hello world')).toEqual('Hallo Welt')
    expect(t('Hello world {name}', { name: 'Aron' })).toEqual('Hallo Aron Welt')
    expect(tNs('Max length {length}', { length: '10' })).toEqual('Maximale länge 10')

    expect(
      tNs('I drove about {km} km per {period} with an {carType}.', {
        km: '10',
        period: 'Woche',
        carType: 'BMW',
      }),
    ).toEqual('I bin pro Woche ca 10 km mit einem BMW gefahren.')
  })

  it('throws exception when trying to use an unknown namespace', () => {
    const testUnknownNs = () => {
      const tNs2 = t('ns2') as TFunction
      tNs2('Hello world')
    }
    expect(testUnknownNs).toThrow(TypeError)
  })

  it('missing language in mode development', () => {
    changeLanguage('fr')
    setMode('development')

    console.warn = jest.fn()
    console.info = jest.fn()

    expect(t('Hello world {name}', { lol: 'unknown' })).toEqual('Hello world {name}')
    expect(console.warn).toHaveBeenCalledWith('(i18n) Missing language [lng=fr]')
    expect(console.warn).toHaveBeenCalledWith(
      '(i18n) Missing option [lng=fr ns=undefined key=Hello world {name} opt=name]',
    )
  })
})
