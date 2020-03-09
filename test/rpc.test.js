const http = require('http')
const listen = require('test-listen')
const express = require('express')
const request = require('request-promise')
const { createServer, stopServer, generateRequest } = require('./utils')
const createError = require('../src/createError')
const rpc = require('../src/rpc')

describe('rpc', () => {
  it('should handle unknown method', async () => {
    expect.assertions(2)
    const server = createServer(rpc())
    let url = await listen(server)
    try {
      await generateRequest({
        url,
        name: 'unknown',
      })
    } catch (error) {
      expect(error.statusCode).toBe(404)
      expect(error.error).toEqual({
        error: 'unknown method',
        handled: true,
        code: 4040,
      })
    }
    stopServer(server)
  })
  it('should handle a request to methods', async () => {
    const server = createServer(rpc())
    let url = await listen(server)
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
    stopServer(server)
  })
  it('should handle a request to methods with custom methods', async () => {
    const name = 'name'
    const fn = () => 'OK'
    const docs = 'some custom method'
    const method = {
      name,
      docs,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name: 'methods',
    })
    expect(body).toEqual([
      {
        name: 'methods',
        docs: 'list all available methods',
      },
      {
        name,
        docs,
      },
    ])
    stopServer(server)
  })
  it('should handle a request to a new method', async () => {
    const name = 'name'
    const result = 'hello, world'
    const fn = () => result
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name,
    })

    expect(body).toEqual({ result })
    stopServer(server)
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
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name,
    })
    expect(body).toEqual({ result })
    stopServer(server)
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
    const server = createServer(rpc(method), errorHandler)
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
    const server = createServer(rpc(method), errorHandler)
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

  it('should handle request to a method with a handled failing function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = () => {
      throw createError({
        message: errorMessage,
      })
    }
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: errorMessage,
        code: 1000,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle request to a method with a handled async failing function', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const fn = async () => {
      throw createError({
        message: errorMessage,
      })
    }
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(400)
      expect(error.error).toEqual({
        error: errorMessage,
        code: 1000,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle request to a method with custom status code', async () => {
    expect.assertions(2)
    const name = 'name'
    const errorMessage = 'nope'
    const statusCode = 401
    const fn = async () => {
      throw createError({
        message: errorMessage,
        statusCode,
      })
    }
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.statusCode).toBe(statusCode)
      expect(error.error).toEqual({
        error: errorMessage,
        code: 1000,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle a request with name in header', async () => {
    const name = 'name'
    const result = 'hello, world'
    const fn = () => result
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await request({
      uri: `${url}/rpc`,
      method: 'POST',
      headers: {
        'x-buffer-rpc-name': name,
      },
      json: true,
    })

    expect(body).toEqual({ result })
    stopServer(server)
  })

  it('should handle a request with name in the body', async () => {
    const name = 'name'
    const result = 'hello, world'
    const fn = () => result
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await request({
      uri: `${url}/rpc`,
      method: 'POST',
      body: {
        name: 'name',
      },
      json: true,
    })

    expect(body).toEqual({ result })
    stopServer(server)
  })

  it('should handle a request with arguments', async () => {
    const name = 'name'
    const fn = (a, b) => a + b
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name,
      args: [2, 2],
    })

    expect(body).toEqual({ result: 4 })
    stopServer(server)
  })

  it('should handle a request with keyed arguments', async () => {
    const name = 'name'
    const fn = ({ a, b }) => a + b
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    let url = await listen(server)
    const body = await generateRequest({
      url,
      name,
      args: { a: 3, b: 1 },
    })

    expect(body).toEqual({ result: 4 })
    stopServer(server)
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
    stopServer(server)
  })

  it('should set custom error code in request body', async () => {
    expect.assertions(1)
    const name = 'name'
    const errorMessage = 'nope'
    const errorCode = 1001
    const fn = async () => {
      const error = new Error(errorMessage)
      error.handled = true
      error.rpcError = true
      error.code = errorCode
      throw error
    }
    const method = {
      name,
      fn,
    }
    const server = createServer(rpc(method))
    try {
      let url = await listen(server)
      await generateRequest({
        url,
        name,
      })
    } catch (error) {
      expect(error.error).toEqual({
        error: errorMessage,
        code: errorCode,
        handled: true,
      })
    }
    stopServer(server)
  })

  it('should handle dependency injection for rpc methods', async () => {
    const name = 'name'
    const fn = jest.fn((req, res, { Utility }) => {
      return Promise.resolve(Utility.someFunc())
    })
    const method = {
      name,
      fn,
    }
    // method that doesn't use utils
    const fnTwo = jest.fn(() => {
      return Promise.resolve(true)
    })
    const methodTwo = {
      name: 'methodTwo',
      fn: fnTwo,
    }
    const server = createServer(
      rpc([method, methodTwo], { Utility: { someFunc: jest.fn() } }),
    )
    let url = await listen(server)
    await generateRequest({
      url,
      name,
    })
    await generateRequest({
      url,
      name: 'methodTwo',
    })
    expect(fn).toHaveBeenCalled()
    stopServer(server)
  })
})
