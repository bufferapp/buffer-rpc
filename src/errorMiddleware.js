module.exports = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }
  res.status(500).send({
    error: error.message,
    code: 1000,
    handled: false,
  })
}
