const listen = require('test-listen')
const { createServer, stopServer, generateRequest } = require('./utils')
const { rpc, method } = require('../src/')
const errorMiddleware = require('../src/errorMiddleware')

describe('errorMiddleware', () => {
  it('should return a json error response', async () => {
    const name = 'someMethod'
    const errorMessage = 'boom'
    const server = createServer(
      rpc(
        method(name, () => {
          throw new Error(errorMessage)
        }),
      ),
      errorMiddleware(),
    )
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(500)
      expect(error.error).toEqual({
        error: errorMessage,
      })
    }
    stopServer(server)
  })

  it('should call before send hook before sending error response', async () => {
    const name = 'someMethod'
    const errorMessage = 'boom'
    const message = 'hi'
    const beforeSend = (req, res) => res.status(200).send({ message })
    const server = createServer(
      rpc(
        method(name, () => {
          throw new Error(errorMessage)
        }),
      ),
      errorMiddleware({ beforeSend }),
    )
    let url = await listen(server)
    const response = await generateRequest({
      url,
      name,
    })
    expect(response).toEqual({
      message,
    })
    stopServer(server)
  })

  it('should call after send hook', async () => {
    expect.assertions(3)
    const name = 'someMethod'
    const errorMessage = 'boom'
    const afterSend = jest.fn()
    const server = createServer(
      rpc(
        method(name, () => {
          throw new Error(errorMessage)
        }),
      ),
      errorMiddleware({ afterSend }),
    )
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(500)
      expect(error.error).toEqual({
        error: errorMessage,
      })
      expect(afterSend).toBeCalled()
    }
    stopServer(server)
  })
})
