module.exports = ({ message, code = 1000, statusCode = 400 }) => {
  const error = new Error(message)
  error.handled = true
  error.code = code
  error.statusCode = statusCode
  return error
}
