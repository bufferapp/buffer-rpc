const listen = require('test-listen')
const Client = require('@bufferapp/micro-rpc-client')
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

describe('client-rpc integration', () => {
  let server
  let client

  beforeAll(async () => {
    server = await createServer(mockThrowingServer, errorMiddleware)
    const url = await listen(server)
    client = new Client({ url: `${url}/rpc` })
  })

  afterAll(() => {
    server.close()
  })

  describe('unhandled errors', () => {
    it('receives the thrown error', () => {
      const result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toThrow('Mock Unexpected Error')
    })

    it('receives a non-handled error', async () => {
      let result

      result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('handled', false)
    })

    it('receives a 500 status code', async () => {
      let result

      result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('status', 500)
    })

    it('receives a 5000 custom error code', async () => {
      let result

      result = client.call('unhandledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('code', 5000)
    })
  })

  describe('handled errors', () => {
    it('receives a handled error', async () => {
      let result

      result = client.call('handledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('handled', true)
    })

    it('receives a 400 status code by default', async () => {
      let result

      result = client.call('handledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('status', 400)
    })

    it('receives a 1000 error code by default', async () => {
      let result

      result = client.call('handledError', { testArg: '' })

      return expect(result).rejects.toHaveProperty('code', 1000)
    })

    it('receives a custom error code', async () => {
      let result

      result = client.call('customCode', { testArg: '' })

      return expect(result).rejects.toHaveProperty('code', 1099)
    })

    it('receives a specific status code', async () => {
      let result

      result = client.call('401', { testArg: '' })

      return expect(result).rejects.toHaveProperty('status', 401)
    })
  })
})
