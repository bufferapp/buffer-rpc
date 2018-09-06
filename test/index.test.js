const listen = require('test-listen')
const { createServer, generateRequest } = require('./utils')
const { rpc, method } = require('../src/')

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
})
