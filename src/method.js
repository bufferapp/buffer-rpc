module.exports = (name, ...args) => ({
  name,
  fn: args[1] ? args[1] : args[0],
  docs: args[1] ? args[0] : undefined,
})
