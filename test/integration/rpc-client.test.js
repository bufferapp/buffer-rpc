const listen = require('test-listen')
const Client = require('micro-rpc-client')
const { createServer } = require('../utils')
const { rpc, method, errorMiddleware, createError } = require('../../src')

const mockThrowingServer = rpc(
  method('unhandledError', () => {
    throw new Error('Mock Unexpected Error')
  }),
  method('handledError', () => {
    throw createError({ message: 'Mock Handled Error' })
  }),
  method('customCode', () => {
    throw createError({ message: 'Unauthorized', code: 1099 })
  }),
  method('401', () => {
    throw createError({ message: 'Unauthorized', statusCode: 401 })
  }),
)

describe('client integration', () => {
  let server
  let client

  beforeAll(async () => {
    server = await createServer(mockThrowingServer, errorMiddleware)
    const url = await listen(server)
    client = new Client({ url })
  })

  afterAll(() => {
    server.close()
  })

  describe('unhandled errors', () => {
    it('returns the thrown error', () => {
      const result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toThrow('Mock Unexpected Error')
    })

    it('returns a non-handled error', async () => {
      let result

      result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('handled', false)
    })

    it('returns a status code', async () => {
      let result

      result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('status', 500)
    })
  })

  describe('handled errors', () => {
    it('returns a handled error', async () => {
      let result

      result = client.call('handledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('handled', true)
    })

    it('returns a custom code error', async () => {
      let result

      result = client.call('customCode', { testArg: '' })

      return expect(result).rejects.toHaveProperty('code', 1099)
    })

    it('returns a specific status code', async () => {
      let result

      result = client.call('401', { testArg: '' })

      return expect(result).rejects.toHaveProperty('status', 401)
    })
  })
})
