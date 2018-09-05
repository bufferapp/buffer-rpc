const http = require('http')
const express = require('express')
const listen = require('test-listen')
const request = require('request-promise')
const rpc = require('../src/rpc')

const createServer = handler => {
  const app = express()
  app.get('*', handler)
  return http.createServer(app)
}

describe('rpc', () => {
  it('should handle unknown method', async () => {
    expect.assertions(2)
    let url = await listen(createServer(rpc()))
    try {
      await request(url)
    } catch (error) {
      expect(error.statusCode).toBe(404)
      expect(JSON.parse(error.error)).toEqual({
        error: 'unknown method',
      })
    }
  })
})
