# kiss-arch

Having an architecture in web apps is crucial to keep the cyclic complexity low.
In software development, there is one simple rule: Complexity is the devil.
However, the web is full of opinions, ideas, patterns and concepts.

Over time, simple ideas tend to grow into extrodinary complex systems,
and what once has been the purpose - to make things easier - often becomes
a nightmare.

This libary implements architecture patterns with the beloved
"keep it simple, stupid" philosophy in mind.

## Setup

    yarn add kiss-arch
    npm i kiss-arch

Full library size, no terser: `~4kb` (`~1.5kb` gzipped, respectively).
Footprint might be lower if you're using a tree-shaking enabled bundler.

## Usage

### Global Variables; Typed Global Caching

Sometimes you need to store values globally, but in Node.js, Deno and
the Browser, we've a different "global" scope.

However there is `globalThis`, but we don't want untyped globals, and
we don't want clashing of names on in global scope.

```ts
// in global.ts, which needs to be loaded in App.ts(x)
import { setGlobal, getGlobal } from 'kiss-arch'

export interface FooBar {
  bar: number
}

// you're well advised to prefix any global variable
// e.g. never use 'name', 'window', etc.
export const CACHE_FOO_NAME = 'myAppName_foo'

// somewhere, e.g.a fetch() request loaded FooBar data from an HTTP endpoint
// now we can cache it across files, scopes etc. easily
setGlobal<FooBar>(CACHE_FOO_NAME, { bar: 123 })

// somewhere else, e.g. in another file, read the data from the global cache
const fooBar = getGlobal<FooBar>(CACHE_FOO_NAME)
```

### App mode

Every app is developed on developers machines, but finally they should
run on an arbitrary other environment like `staging` or `test`, and finally in `production`.

So, it might be a beneficial when application behaviour might differ between them,
but please, only for debugging/tracing purposes, not for general application logic,
otherwise you'll face bugs in production that weren't able to be discovered in
development/test.

But every runtime environment, such as Browser, Node.js, Deno etc., and often even
per framework/bundler tooling etc. the original value set for the mode might differ.
If we want to re-use code or just be flexible, we need to abstract that.

This is how we do it:

```ts
// in mode.ts, which needs to be loaded in App.ts(x)
import { getMode, setMode } from 'kiss-arch'

// entrypoint of your application
// there is only 'development' or 'production' mode
setMode('development')

// whereever you're in your application check typed, e.g.
if (getMode() === 'development') {
  console.log('your debugging/tracing code goes here...')
}
```

### Nano Store(s)

In application development, we always have to deal with data (storage, persistency),
and logic (algorithms, decision making).

Now data needs to be modelled well. It's desiable to use domain driven modelling for this.
Depending on the requirements, you might night one or more "storage places", like shelfs.
You might want to define one per purpose which only holds data for a certain kind, like shoes, or food - you wouldn't place stinky shoes next to fresh salat, wouldn't you?!

Therefore, stores should be typed. They should be able to `set`, `get` single entries,
check if the store `has` an entry, being able to `remove` entries, and also be able
to `persist` and `load` data, temporary or for long-term, depending on the requirements.

Does this need to be so complicated?
Actually, it can be very simple, but we want to use some advanced typing
and domain modelling so that we're always on the safe side when working with data:

```ts
// appStore.ts, which needs to be loaded in App.ts(x)
import { getStore } from 'kiss-arch'

// define the appState (a global application state)
export interface AppState {
  isSettingsDialogOpen: boolean
  userName: string
}

// the whole store interface may consist of many sub-state objects
export interface AppStore {
  // appState is a nano state, a subset of the whole store
  appState: AppState

  // another typical use-case would be an applications Feature Flags.
  // featureFlags: FeatureFlags
}

// every application needs initial values, defaults
export const DEFAULTS_APP_STATE: AppState = {
  isSettingsDialogOpen: false, // don't open by default, e.g. first app open
  userName: null, // we don't know the user on first app open
}

// we need a global cache name
export const APP_STORE_IDENT_NAME = '_APP_STORE'

// also the key name of the sub-state should be defined
export const APP_STATE_PROP_NAME = 'appState'

// we get an instance of the store via its global cache name
export const appStore = getStore<AppStore>(APP_STORE_IDENT_NAME)

// we load the nano sub-set (state might have been saved before)
// we also need to reference the default values, if not
appStore.load(APP_STATE_PROP_NAME, DEFAULTS_APP_STATE)

// optionally, we define some helper functions for storing sub-state
// save() uses LocalStorage, saveForSession() would use SessionStorage
// if those interfaces are not available, a mocked interface is used
// (backed by a global variable)
export const saveAppState = () => appStore.save(APP_STATE_PROP_NAME)
export const getAppState = (): AppState => appStore.get(APP_STATE_PROP_NAME) || DEFAULTS_APP_STATE

// overloading of types makes sure that if the developer
// sets a nano subset key (e.g. 'isSettingsDialogOpen')
// only the correct value type can be assinged
export const setAppState: Overloading<AppState, keyof AppState> = (
  key: keyof AppState,
  value: AppState[keyof AppState],
) => {
  getAppState()[key] = value as never

  // in this application, setting a state would always save to LocalStorage
  // so that when the window is reloaded, state is restored (see appStore.load() above)
  saveAppState()
}
```

And this is, how we can use this apps nano store:

```ts
// e.g. in some handler function that handles dialog opening
setAppState('isSettingsDialogOpen', true)

// e.g. fetch nano app substate; it has full typing support
getAppState().isSettingsDialogOpen
```

## Event Bus

Wiring application logic can become a tedious task. Once many operations need
to be triggered because of one single reason, the typical solution is to hard-wire calls.
However, this leads to a lot of hard code dependencies and might end up in
so called "spaghetti code" where one call follows another, and an application
ends up to be a huge chain of conditional function calls.

Using an event bus is a neat way to solve this, but event busses are often
thought of the be hard to use and/or implement.

This mustn't be true. Only use the raw event bus if requirements make it
desirable to react on input events (cause) with more than one handler
functions (effect), and if this should never end (=> ergo, a "stream of events").

```ts
// appEvents.ts, which needs to be loaded in App.ts(x)
import { getBus } from 'kiss-arch'

// define some event object to be send over the bus
// this usually carries information, like function arguments would
export interface SendPushNotificationPayload {
  message: string
  icon: string
}

// we need some event name
export const EVENT_EVENT_SEND_PUSH_NOTIFICATIOON = 'sendPushNotification'

// get a bus instance to broadcast events of a specific kind (cause)
export const notificationsBus = getBus<EVENT_LOGIN, SendPushNotificationPayload>('notificationsBus')

// somewhere else, you need to register a handler that will be
// called for login request (effect, triggered by .emit(...))
notificationsBus.on(EVENT_EVENT_SEND_PUSH_NOTIFICATIOON, async (payload: SendPushNotificationPayload) => {
  // e.g. trigger FCM (Firebase Cloud Messaging)
})

// somebody logs-in via button tap,
// but also when someone logs-in via some other UI (trigge the cause)
notificationsBus.emit(EVENT_EVENT_SEND_PUSH_NOTIFICATIOON, {
  message: 'You have achieved a new highscore!',
  icon: 'goal',
})
```

## CQRS / Command Query Request Segregation

We've seen the event bus - it is capable of emitting and handling events and their payload
via the publish/subscribe messaging pattern. However, the event bus is designed to
handle infinite streaming messaging. But more often than that, we want to implement
the request and response messaging pattern where a unique request needs to be answered
directly with a unique answer.

Now we could use the event bus for that and alwas reply with another event once we received and handled one. However, this is tedious, and can be abstracted.

We understand triggering events as `commands` or `queries`, a command is handled
with an action handler that actually does something. A quers is handled with a
query handler that returns some data. Technically, both are implemented in the same way, but for application architecture, it is important to seperate the concerns:

```ts
// appCommands.ts, which needs to be loaded in App.ts(x)
import { addCommandResponseHandler, command, CommandActor, CommandHandler } from 'kiss-arch'

export interface PayloadOpenClose {
  open: boolean
}

export interface PayloadLogin {
  username: string
  password: string
}

export interface PayloadLoginResponse {
  isValid: boolean
  message: string
}

export type AppCommandName = 'toggleSettingsDialog' | 'login'

export const appCommand = async <CommandPayload, CommandResponsePayload = unknown>(
  commandName: AppCommandName,
  payload: CommandPayload,
  oneTimeResponseHandler?: CommandHandler<CommandResponsePayload>,
) => command(commandName, payload, oneTimeResponseHandler)

export const appCommandHandler = <CommandPayload, CommandResponsePayload>(
  commandName: AppCommandName,
  actor: CommandActor<CommandPayload, CommandResponsePayload>,
) => {
  addCommandResponseHandler<AppCommandName, CommandPayload, CommandResponsePayload>(commandName, actor)
}
```

And this is how we use the above abstraction:
First we define handlers. It is important to load this code via `import` early.

```ts
// e.g. commands/loginHandler.ts which needs to be loaded in appCommands.ts
import { appCommandHandler, PayloadLogin, PayloadLoginResponse } from '../appCommands'

export const COMMAND_LOGIN = 'login'

appCommandHandler(COMMAND_LOGIN, async (payload: PayloadLogin) => {
  // e.g. login against a HTTP API
  // const loginResponse = await (await fetch(`https://foo.bar/login`, { 'Authorization': `Basic ${payload.username}+${payload.password}`})).json()

  return {
    isValid: loginResponse.success,
    message: loginResponse.message || 'Login successful',
  } as PayloadLoginResponse
})
```

Now from whereever in the app, e.g. a login button, we can run the command:

```ts
appCommand<PayloadLogin, PayloadLoginResponse>(
  COMMAND_LOGIN,
  {
    password: 'foo',
    username: 'bar',
  },
  async (loginResponse: PayloadLoginResponse) => {
    // here, we're directly receiving the answer "in-place"
    console.log('PayloadLoginResponse', loginResponse.isValid, loginResponse.message)
  },
)
```

## i18n / translation

One of the common features of an App is to be translatable to the users language.
This, however, is not always the most simple task. You probably need some advanced
features such as: Variable interpolation, splitting of translation messages per module,
and formatting functions.

First we load our translations:

```ts
// in i18n.ts, which needs to be loaded in App.ts(x)
import { setTranslations } from 'kiss-arch'

// import JSON files directly, you can also use JSON5 with an external module, if desired
import de from 'i18n/de.json'
import en from 'i18n/en.json'

setTranslations('en', en)
setTranslations('de', de)
```

A translation file could look like that, e.g. for german:

```json
{
  "Hello world": "Hallo Welt",
  "Hello <b>World</b>": "Hallo <b>Welt</b>",
  "Hello world {name}": "'Hallo {name} Welt",
  "fooSpace": {
    "Hello world {name}": "'Hallo {name} Welt in Space"
  }
}
```

You can see that with those sub-objects, we can manage translation modules,
and with `{variableName}` syntax, we manage variable interpolation.

This is how it is used:

```ts
import { t, changeLanguage, TFunction } from 'kiss-arch'

// language defaults to: en
// changing to german here
changeLanguage('de')

// leads to: "Hallo Welt, Mellon"
t('Hello world {name}', { name: 'Mellon' })

// and back to english
changeLanguage('en')

// leads to: "Hello world, Mellon"
t('Hello world {name}', { name: 'Mellon' })

// translating from a module
const tFoo = t('fooSpace') as TFunction

// leads to: "Hello world, Mellon in Space"
tFoo('Hello world {name}', { name: 'Mellon' })
```

If there is no translation, a warning message will be printed to `console`
in case `getMode()` returns `development`, and the key will be rendered.

## Test

    yarn test

This library comes with substantial test coverage > 90%.
