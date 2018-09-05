const method = require('../src/method')

describe('method', () => {
  it('should create a method', () => {
    const name = 'name'
    const fn = () => {}
    expect(method(name, fn)).toEqual({
      name,
      fn,
    })
  })
})
