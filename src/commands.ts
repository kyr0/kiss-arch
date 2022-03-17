import { getBus } from './bus'

export interface CommandPayloadBase {
  commandSequenceId?: number
}

export type CommandActor<CommandPayload, CommandPayloadResponse> = (
  payload: CommandPayload,
) => Promise<CommandPayloadResponse>

export type CommandHandler<ActionPayload extends CommandPayloadBase> = (payload: ActionPayload) => void
export type CommandHandlerResponse<ActionPayload> = ActionPayload & CommandPayloadBase
export type Command<P = unknown> = (payload: P) => Promise<void>
export type CommandHandlerType = 'one-time' | 'continuous'

export const COMMAND_BUS_NAME = '_COMMAND_BUS_NAME'

export const getCommandResponseTopic = <CommandName>(commandName: CommandName): CommandName =>
  `${commandName}:response` as unknown as CommandName

export const getCommandBus = <CommandName = string, CommandPayload = unknown>() =>
  getBus<CommandName, CommandPayload>(COMMAND_BUS_NAME)

let commandSequenceId = 0

export const addCommandHandler = <CommandName, CommandPayload>(
  commandName: CommandName,
  handler: CommandHandler<CommandPayload>,
  handlerType: CommandHandlerType = 'continuous',
  discreteCommandSequenceId?: number,
) => {
  const bus = getCommandBus<CommandName, CommandPayload>()
  const awaitsWithResponse = typeof discreteCommandSequenceId !== 'undefined'
  const topicName = awaitsWithResponse ? getCommandResponseTopic(commandName) : commandName

  const subscriberId = bus.on(topicName, (handlerPayload: CommandPayload) => {
    if (handlerType === 'one-time') {
      if (awaitsWithResponse) {
        if ((handlerPayload as CommandPayloadBase).commandSequenceId === discreteCommandSequenceId) {
          bus.off(subscriberId)
        }
      } else {
        bus.off(subscriberId)
      }
    }
    return handler(handlerPayload)
  })
}

// runs an action and awaits an immediate response
export const runCommand = async <CommandName, CommandPayload, CommandResponsePayload = unknown>(
  commandName: CommandName,
  payload: CommandPayload,
): Promise<CommandHandlerResponse<CommandResponsePayload>> =>
  new Promise((resolve) => {
    commandSequenceId += 1

    const oneTimeResponseHandler: CommandHandler<CommandResponsePayload> = (payload: CommandResponsePayload) => {
      resolve({
        ...payload,
        // apply unique command sequence number
        commandSequenceId,
      })
    }

    const bus = getCommandBus<CommandName, CommandPayload>()

    // listen for command action
    if (typeof oneTimeResponseHandler === 'function') {
      //console.log('oneTimeResponseHandler')
      addCommandHandler(commandName, oneTimeResponseHandler, 'one-time', commandSequenceId)
    }

    // trigger command action
    bus.emit(commandName, {
      ...payload,
      // apply unique command sequence number
      commandSequenceId,
    })
  })

// register a function that handles commands and responds
export const addCommand = <CommandName, CommandPayload, CommandResponsePayload>(
  commandName: CommandName,
  actor: CommandActor<CommandPayload, CommandResponsePayload>,
) => {
  const bus = getCommandBus<CommandName, CommandPayloadBase>()
  bus.on(commandName, async (commandPayload: CommandPayloadBase) =>
    bus.emit(getCommandResponseTopic(commandName), {
      ...(await actor(commandPayload as CommandPayload)),
      // assign correct commandSequenceId for time-discrete one-time handlers
      commandSequenceId: commandPayload.commandSequenceId,
    }),
  )
}
