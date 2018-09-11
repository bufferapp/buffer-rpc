const Client = require('micro-rpc-client')
const getPort = require('get-port')

const testApps = require('./test-apps')

Object.keys(testApps).forEach((key) => {
  describe(`app: ${key}`, () => {
    let server
    let client


    beforeAll (async () => {
      const availablePort = await getPort()
      return new Promise((resolve, reject) => {
        server = testApps[key].listen(availablePort, (err) => {
          if(err) {
            reject(err)
          }
          const port = server.address().port
          const url = `http://localhost:${port}/rpc`
          client = new Client({
            url,
          });
          resolve()
        })
      })
    })

    afterAll (() => {
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
})
