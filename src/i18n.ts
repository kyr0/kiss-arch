import { getBus } from './bus'
import { commandWithResponse } from './commands'
import { getGlobal, setGlobal } from './global'
import { getMode } from './mode'
import { getStore } from './store'

export interface Option {
  [variable: string]: string
}

export type TFunction = (key: string, options?: Option) => string

export interface NamespaceTranslation {
  [namespace: string]: { [key: string]: string } | string
}

export interface Translations {
  [language: string]: NamespaceTranslation
}

export interface I18nApi {
  language: string
  nsTranslation: string | undefined
  translations: Translations
  changeLanguage: (language: string) => void
  t: (namespace: string, options?: Option) => TFunction | string
  setTranslations: (language: string, translations: NamespaceTranslation) => I18nApi
}

export interface I18nStore {
  lng: string
  translations: Translations
}

export const VARIABLE_REGEX = /{([^}]*)}/g
export const I18N_STORE = '_I18N_STORE'
export const ENGLISH_ISO2 = 'en'

export const getLanguage = (): string => {
  const i18nStore = getGlobal<I18nStore>(I18N_STORE)
  return i18nStore ? i18nStore.lng : ENGLISH_ISO2
}

setGlobal<I18nStore>(I18N_STORE, {
  lng: getLanguage(),
  translations: {
    [getLanguage()]: {},
  },
})

export const changeLanguage = (language: string) => {
  getGlobal<I18nStore>(I18N_STORE).lng = language
  getBus().emit('languageChange', language)
}

const init = (namespace: string | undefined, key: string) => {
  const { lng, translations } = getGlobal<I18nStore>(I18N_STORE)

  const namespaces = translations[lng] || {}

  if (getMode() === 'development' && typeof translations[lng] === 'undefined') {
    console.warn(`(i18n) Missing language [lng=${lng}]`)
  }

  let pairs
  if (typeof namespace === 'undefined') {
    pairs = translations[lng]
  } else {
    pairs = namespaces[namespace] || {}
    if (getMode() === 'development' && typeof namespaces[namespace] === 'undefined') {
      console.warn(`(i18n) Missing namespace [lng=${lng} ns=${namespace}]`)
    }
  }

  const translation = pairs ? pairs[key] : key
  if (getMode() === 'development' && typeof translation === 'undefined') {
    console.warn(`(i18n) Missing key [lng=${lng} namespace=${namespace} key=${key}]`)
  }
  return { namespace, translation, lng }
}

const translate = (ns: string | undefined, key: string, options = {}): string => {
  const config = init(ns, key)
  let { translation } = config
  const { lng, namespace } = config
  const consumedOptions: any = { ...options }
  const optionKeys = (translation as string).match(VARIABLE_REGEX) || []

  for (let index = 0; index < optionKeys.length; index += 1) {
    const optionRawKey = optionKeys[index]

    // skip duplicates
    if (optionKeys.indexOf(optionRawKey) !== index) continue

    const optionKey = optionRawKey.substring(1, optionRawKey.length - 1)
    const optionValue = consumedOptions[optionKey] || ''

    if (getMode() === 'development' && typeof consumedOptions[optionKey] === 'undefined') {
      console.warn(`(i18n) Missing option [lng=${lng} ns=${namespace} key=${key} opt=${optionKey}]`)
    }

    delete consumedOptions[optionKey]

    // fast replace of all duplicates
    translation = (translation as string).split(`{${optionKey}}`).join(optionValue)
  }

  // istanbul ignore else
  if (getMode() === 'development') {
    const unusedOptions = Object.keys(consumedOptions)
    for (let index = 0; index < unusedOptions.length; index += 1) {
      console.info(`(i18n) Unknown option [lng=${lng} ns=${namespace} key=${key}, opt=${unusedOptions[index]}]`)
    }
  }
  return translation as string
}

export const t = (nsOrKey: string, options = {}): TFunction | string => {
  const i18nStore = getGlobal<I18nStore>(I18N_STORE)
  const targetLanguageTranslations = i18nStore.translations[i18nStore.lng]

  if (typeof targetLanguageTranslations === 'undefined') {
    if (getMode() === 'development') {
      // spit-out warning messages
      translate(undefined, nsOrKey, options)
    }
    // no translation available; fallback to input
    return nsOrKey
  }

  const type = typeof targetLanguageTranslations[nsOrKey]

  if (type === 'string') {
    // return translation w/o namespace
    return translate(undefined, nsOrKey, options)
  }
  if (type === 'object') {
    // return a namespaced translation function
    return (key: string, namespacedOptions = {}) => translate(nsOrKey, key, namespacedOptions)
  }
}

export const setTranslations = (namespaceTranslation: NamespaceTranslation, language = ENGLISH_ISO2) => {
  const i18nStore = getGlobal<I18nStore>(I18N_STORE)

  if (!i18nStore.translations[language]) {
    i18nStore.translations[language] = {}
  }
  i18nStore.translations[language] = namespaceTranslation
}
