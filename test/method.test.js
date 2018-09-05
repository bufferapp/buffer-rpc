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
  it('should create a method with docs', () => {
    const name = 'docs'
    const fn = () => {}
    const docs = 'do a thing'
    expect(method(name, docs, fn)).toEqual({
      name,
      fn,
      docs,
    })
  })
})
