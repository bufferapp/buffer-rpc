module.exports = ({ message, code, statusCode = 400 }) => {
  const error = new Error(message)
  error.handled = true
  error.code = code
  error.statusCode = statusCode
  return error
}
