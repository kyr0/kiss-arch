import { addCommandResponseHandler, command, CommandActor, CommandHandler } from '../commands'

describe('command', () => {
  interface PayloadOpenClose {
    open: boolean
  }

  interface PayloadLogin {
    username: string
    password: string
  }

  interface PayloadLoginResponse {
    isValid: boolean
    message: string
  }

  type AppCommandName = 'toggleSettingsDialog' | 'login'

  const appCommand = async <CommandPayload, CommandResponsePayload = unknown>(
    commandName: AppCommandName,
    payload: CommandPayload,
    oneTimeResponseHandler?: CommandHandler<CommandResponsePayload>,
  ) => command(commandName, payload, oneTimeResponseHandler)

  const appCommandHandler = <CommandPayload, CommandResponsePayload>(
    commandName: AppCommandName,
    actor: CommandActor<CommandPayload, CommandResponsePayload>,
  ) => {
    addCommandResponseHandler<AppCommandName, CommandPayload, CommandResponsePayload>(commandName, actor)
  }

  it('can add a command handler and run it', async () => {
    const COMMAND_LOGIN = 'login'

    const loginCommandHandler = jest.fn(async (payload: PayloadLogin) => {
      // e.g. login against a HTTP API
      // const loginResponse = await (await fetch(`https://foo.bar/login`, { 'Authorization': `Basic ${payload.username}+${payload.password}`})).json()

      return {
        isValid: true,
        message: 'Login successful',
      } as PayloadLoginResponse
    })

    appCommandHandler(COMMAND_LOGIN, loginCommandHandler)

    const loginCommandResponseHandler = jest.fn(async (loginResponse: PayloadLoginResponse) => {
      // here, we're directly receiving the answer "in-place"

      expect(loginResponse.isValid).toEqual(true)
      expect(loginResponse.message).toEqual('Login successful')
    })

    await appCommand<PayloadLogin, PayloadLoginResponse>(
      COMMAND_LOGIN,
      {
        password: 'foo',
        username: 'bar',
      },
      loginCommandResponseHandler,
    )

    expect(loginCommandHandler.mock.calls.length).toBe(1)

    expect(loginCommandResponseHandler.mock.calls.length).toBe(1)
  })
})
