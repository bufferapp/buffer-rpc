const http = require('http')
const express = require('express')
const listen = require('test-listen')
const bodyParser = require('body-parser')
const request = require('request-promise')
const rpc = require('../src/rpc')

const createServer = handler => {
  const app = express()
  app.use(bodyParser.json())
  app.post('*', handler)
  return http.createServer(app)
}

const generateRequest = ({ url, name }) =>
  request({
    uri: url,
    method: 'POST',
    body: {
      name,
    },
    json: true,
  })

describe('rpc', () => {
  it('should handle unknown method', async () => {
    expect.assertions(2)
    let url = await listen(createServer(rpc()))
    try {
      await generateRequest({
        url,
        name: 'unknown',
      })
    } catch (error) {
      expect(error.statusCode).toBe(404)
      expect(error.error).toEqual({
        error: 'unknown method',
      })
    }
  })
  it('should handle a request to methods', async () => {
    let url = await listen(createServer(rpc()))
    const body = await generateRequest({
      url,
      name: 'methods',
    })
    expect(body).toEqual([
      {
        name: 'methods',
        docs: 'list all available methods',
      },
    ])
  })
})
