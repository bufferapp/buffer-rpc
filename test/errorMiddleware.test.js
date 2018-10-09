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
      errorMiddleware,
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

  it('should not send an error response if a response has already been sent', async () => {
    const name = 'someMethod'
    const message = 'OK'
    const server = createServer(
      rpc(
        method(name, (req, res) => {
          res.send({ message })
          throw new Error('some error happend after sending')
        }),
      ),
      errorMiddleware,
    )
    let url = await listen(server)
    const response = await generateRequest({
      url,
      name,
    })
    expect(response).toEqual({ message })
    stopServer(server)
  })
})
