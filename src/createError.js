module.exports = ({ message, statusCode = 400 }) => {
  const error = new Error(message)
  error.handled = true
  error.statusCode = statusCode
  return error
}
