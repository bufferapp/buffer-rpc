const http = require('http')
const listen = require('test-listen')
const express = require('express')
const request = require('request-promise')
const { createServer, generateRequest } = require('./utils')
const rpc = require('../src/rpc')

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
  it('should handle a request to a new method', async () => {
    const name = 'name'
    const result = 'hello, world'
    const fn = () => result
    const method = {
      name,
      fn,
    }
    let url = await listen(createServer(rpc(method)))
    const body = await generateRequest({
      url,
      name,
    })

    expect(body).toEqual({ result })
  })
  it('should handle request to a method with an async function', async () => {
    const name = 'name'
    const result = 'hello, world - async'
    const fn = async () => {
      return result
    }
    const method = {
      name,
      fn,
    }
    let url = await listen(createServer(rpc(method)))
    const body = await generateRequest({
      url,
      name,
    })
    expect(body).toEqual({ result })
  })

  it('should handle request to a method with an unhandled failing async function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = async () => {
      throw new Error(errorMessage)
    }
    const method = {
      name,
      fn,
    }
    const errorHandler = (error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      res.status(500).send({ error: error.message })
    }
    try {
      let url = await listen(createServer(rpc(method), errorHandler))
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
  })

  it('should handle request to a method with an unhandled failing function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = () => {
      throw new Error(errorMessage)
    }
    const method = {
      name,
      fn,
    }
    const errorHandler = (error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      res.status(500).send({ error: error.message })
    }
    try {
      let url = await listen(createServer(rpc(method), errorHandler))
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
  })

  it('should handle request to a method with a handled failing function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = () => {
      const error = new Error(errorMessage)
      error.handled = true
      throw error
    }
    const method = {
      name,
      fn,
    }
    try {
      let url = await listen(createServer(rpc(method)))
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: errorMessage,
      })
    }
  })

  it('should handle request to a method with a handled async failing function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = async () => {
      const error = new Error(errorMessage)
      error.handled = true
      throw error
    }
    const method = {
      name,
      fn,
    }
    try {
      let url = await listen(createServer(rpc(method)))
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: errorMessage,
      })
    }
  })

  it('should handle request to a method with custom status code', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const statusCode = 401
    const fn = async () => {
      const error = new Error(errorMessage)
      error.handled = true
      error.statusCode = statusCode
      throw error
    }
    const method = {
      name,
      fn,
    }
    try {
      let url = await listen(createServer(rpc(method)))
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(statusCode)
      expect(error.error).toEqual({
        error: errorMessage,
      })
    }
  })

  it('should handle a request with name in header', async () => {
    const name = 'name'
    const result = 'hello, world'
    const fn = () => result
    const method = {
      name,
      fn,
    }
    let url = await listen(createServer(rpc(method)))
    const body = await request({
      uri: url,
      method: 'POST',
      headers: {
        'x-buffer-rpc-name': name,
      },
      json: true,
    })

    expect(body).toEqual({ result })
  })

  it('should handle a request with arguments', async () => {
    const name = 'name'
    const fn = (a, b) => a + b
    const method = {
      name,
      fn,
    }
    let url = await listen(createServer(rpc(method)))
    const body = await generateRequest({
      url,
      name,
      args: [2, 2],
    })

    expect(body).toEqual({ result: 4 })
  })

  it('should handle a request with keyed arguments', async () => {
    const name = 'name'
    const fn = ({ a, b }) => a + b
    const method = {
      name,
      fn,
    }
    let url = await listen(createServer(rpc(method)))
    const body = await generateRequest({
      url,
      name,
      args: { a: 3, b: 1 },
    })

    expect(body).toEqual({ result: 4 })
  })

  it('should fail if parsed body is missing', async () => {
    expect.assertions(2)
    const app = express()
    app.post('*', rpc())
    app.use((error, req, res, next) => {
      if (res.headersSent) {
        return next(error)
      }
      res.status(500).send({ error: error.message })
    })
    const server = http.createServer(app)
    let url = await listen(server)
    try {
      await generateRequest({
        url,
        name: 'methods',
      })
    } catch (error) {
      expect(error.statusCode).toBe(500)
      expect(error.error).toEqual({
        error: 'no req.body found, is app.use(bodyParser.json()) hooked up?',
      })
    }
  })
})
