module.exports = ({
  message,
  code = 1000,
  statusCode = 400,
  handled = true,
}) => {
  const error = new Error(message)
  error.rpcError = true
  error.code = code
  error.statusCode = statusCode
  error.handled = handled
  return error
}
