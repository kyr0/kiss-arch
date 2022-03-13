import { getGlobal, setGlobal } from './global'

export type EventHandler<E> = (event: E) => void

export interface Subscriber<T, E> {
  topic: T
  handler: EventHandler<E>
}

export interface BusApi<T, E> {
  subscribers: Array<Subscriber<T, E> | undefined>
  on<EH extends EventHandler<E>>(topic: T, handler: EH): number
  off(subscriberId: number): void
  emit<EE extends E>(topic: T, event: EE): void
}

export const getBus = <T, E>(identifier = '_BUS'): BusApi<T, E> => {
  let BUS = getGlobal<BusApi<T, E>>(identifier)
  if (BUS) return BUS // singleton early return
  BUS = setGlobal<BusApi<T, E>>(identifier, {
    subscribers: [],
    on: <EH extends EventHandler<E>>(topic: T, handler: EH) =>
      BUS.subscribers.push({
        topic,
        handler,
      }) - 1,
    off: (subscriberIndex: number) => {
      BUS.subscribers[subscriberIndex] = undefined
    },
    emit: <EE extends E>(topic: T, event: EE) => {
      for (let i = 0; i < BUS.subscribers.length; i += 1) {
        if (
          BUS.subscribers &&
          // after unsubscribe, a handler can be undefined, need to check
          BUS.subscribers[i] &&
          BUS.subscribers[i].topic === topic
        ) {
          BUS.subscribers[i]!.handler(event)
        }
      }
    },
  })
  return BUS
}
