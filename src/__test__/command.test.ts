import { addCommand, runCommand, CommandActor, CommandHandlerResponse } from '../commands'

describe('command', () => {
  interface PayloadLogin {
    username: string
    password: string
  }

  interface PayloadLoginResponse {
    isValid: boolean
    message: string
  }

  type AppCommandName = 'toggleSettingsDialog' | 'login'

  // just to spare on typing
  const runAppCommand = async <CommandPayload, CR>(
    commandName: AppCommandName,
    payload: CommandPayload,
  ): Promise<CommandHandlerResponse<CR>> => runCommand(commandName, payload)

  // just for spare on typing
  const addAppCommand = <CommandPayload, CommandResponsePayload>(
    commandName: AppCommandName,
    actor: CommandActor<CommandPayload, CommandResponsePayload>,
  ) => addCommand<AppCommandName, CommandPayload, CommandResponsePayload>(commandName, actor)

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

    addAppCommand(COMMAND_LOGIN, loginCommandHandler)

    const loginResponse = await runAppCommand<PayloadLogin, PayloadLoginResponse>(COMMAND_LOGIN, {
      password: 'foo',
      username: 'bar',
    })
    expect(loginResponse).toBeDefined()
    expect(loginResponse.isValid).toEqual(true)
    expect(loginResponse.message).toEqual('Login successful')

    expect(loginCommandHandler.mock.calls.length).toBe(1)
  })
})
