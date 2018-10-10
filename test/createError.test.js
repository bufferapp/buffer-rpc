const createError = require('../src/createError')

describe('createError', () => {
  it('should create an error with default status code', () => {
    const message = 'some error'
    const error = createError({
      message,
    })
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(400)
    expect(error.handled).toBe(true)
    expect(error.rpcError).toBe(true)
  })

  it('should create an error with a custom status code', () => {
    const message = 'some error'
    const statusCode = 401
    const error = createError({
      message,
      statusCode,
    })
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(statusCode)
    expect(error.handled).toBe(true)
    expect(error.rpcError).toBe(true)
  })

  it('should create an error with default code', () => {
    const message = 'some error'
    const code = 1000
    const error = createError({
      message,
    })
    expect(error.message).toBe(message)
    expect(error.code).toBe(code)
    expect(error.handled).toBe(true)
    expect(error.rpcError).toBe(true)
  })

  it('should create an error with custom code', () => {
    const message = 'some error'
    const code = 1001
    const error = createError({
      message,
      code,
    })
    expect(error.message).toBe(message)
    expect(error.code).toBe(code)
    expect(error.handled).toBe(true)
    expect(error.rpcError).toBe(true)
  })

  it('should create an error that is handled = false', () => {
    const message = 'some error'
    const handled = false
    const error = createError({
      message,
      handled,
    })
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(400)
    expect(error.handled).toBe(handled)
    expect(error.rpcError).toBe(true)
  })
})
