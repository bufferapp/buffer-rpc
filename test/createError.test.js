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
})
