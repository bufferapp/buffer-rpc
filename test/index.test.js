const listen = require('test-listen')
const { createServer, stopServer, generateRequest } = require('./utils')
const { rpc, method, createError, errorMiddleware } = require('../src/')

describe('index', () => {
  it('should handle a response', async () => {
    const name = 'someMethod'
    const result = 'hello, world'
    const server = createServer(rpc(method(name, () => result)))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name,
    })
    expect(body).toEqual({ result })
    stopServer(server)
  })

  it('should handle a handled error response', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const server = createServer(
      rpc(
        method(name, () => {
          throw createError({
            message,
          })
        }),
      ),
    )
    let url = await listen(server)
    try {
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: message,
        code: 1000,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle a handled error response with custom code', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const code = 10001
    const server = createServer(
      rpc(
        method(name, () => {
          throw createError({
            message,
            code,
          })
        }),
      ),
    )
    let url = await listen(server)

    try {
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: message,
        code,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle an unhandled error response', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const customErrorHandler = (error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      res.status(500).send({ error: error.message })
    }
    const server = createServer(
      rpc(
        method(name, () => {
          throw new Error(message)
        }),
      ),
      customErrorHandler,
    )
    let url = await listen(server)

    try {
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(500)
      expect(error.error).toEqual({
        error: message,
      })
    }
    stopServer(server)
  })

  it('should handle an unhandled error response with error middleware', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const server = createServer(
      rpc(
        method(name, () => {
          throw new Error(message)
        }),
      ),
      errorMiddleware,
    )
    let url = await listen(server)
    try {
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(500)
      expect(error.error).toEqual({
        error: message,
        code: 5000,
        handled: false,
      })
    }
    stopServer(server)
  })
})
