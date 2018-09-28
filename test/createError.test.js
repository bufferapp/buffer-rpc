const createError = require('../src/createError')

describe('createError', () => {
  it('should create an error with default status code', () => {
    const message = 'some error'
    const error = createError({
      message,
    })
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(400)
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
  })

  it('should create an error with custom code', () => {
    const message = 'some error'
    const code = 1000
    const error = createError({
      message,
      code,
    })
    expect(error.message).toBe(message)
    expect(error.code).toBe(code)
  })
})
