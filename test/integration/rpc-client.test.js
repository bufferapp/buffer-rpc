const listen = require('test-listen')
const Client = require('micro-rpc-client')
const { createServer } = require('../utils')
const { rpc, method } = require('../../src')

const mockThrowingServer = rpc(
  method('throws', () => {
    throw new Error('Mock Unexpected Error')
  })
)

const errorHandlerStyles = [
  ['defaultErrorHandler', null],
  [
    'returnJsonWithErrorProperty',
    (err, req, res, next) => {
      res.status(err.statusCode || 500).json({ error: err.message })
    },
  ],
  [
    'returnJsonWithErrProperty',
    (err, req, res, next) => {
      res.status(err.statusCode || 500).json({ err: err.message })
    },
  ],
]


describe.each(errorHandlerStyles)('app: %s', (name, mockErrorHandler) => {
  let server
  let client

  beforeAll(async () => {
    server = await createServer(mockThrowingServer, mockErrorHandler)
    const url = await listen(server)
    client = new Client({ url })
  })

  afterAll(() => {
    server.close()
  })

  it('returns the thrown error', () => {
    const result = client.call('throws', {
      testArg: ''
    })

    return expect(result).rejects.toThrow('Mock Unexpected Error')
  })

  it('returns a non-handled error', async () => {
    let result
    let error

    try{
      result = await client.call('throws', {
        testArg: ''
      })
    } catch (e) {
      error = e
    }

    expect(result).toBe(undefined)
    expect(error).toBeDefined()
    expect(error.handled).toBeFalsy()
  })
})
