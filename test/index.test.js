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
      })
    }
  })
})
