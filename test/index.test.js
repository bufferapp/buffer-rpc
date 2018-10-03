const listen = require('test-listen')
const { createServer, generateRequest } = require('./utils')
const { rpc, method, createError } = require('../src/')

describe('index', () => {
  it('should handle a response', async () => {
    const name = 'someMethod'
    const result = 'hello, world'
    let url = await listen(createServer(rpc(method(name, () => result))))
    const body = await generateRequest({
      url,
      name,
    })
    expect(body).toEqual({ result })
  })

  it('should handle a handled error response', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    let url = await listen(
      createServer(
        rpc(
          method(name, () => {
            throw createError({
              message,
            })
          }),
        ),
      ),
    )

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
      })
    }
  })

  it('should handle a handled error response with custom code', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const code = 10001
    let url = await listen(
      createServer(
        rpc(
          method(name, () => {
            throw createError({
              message,
              code,
            })
          }),
        ),
      ),
    )

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
      })
    }
  })

  it('should handle an unhandled error response', async () => {
    expect.assertions(2)
    const name = 'someMethod'
    const message = 'nope'
    const errorHandler = (error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      res.status(500).send({ error: error.message })
    }
    let url = await listen(
      createServer(
        rpc(
          method(name, () => {
            throw new Error(message)
          }),
        ),
        errorHandler,
      ),
    )

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
  })
})
