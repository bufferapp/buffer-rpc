module.exports = (hooks = {}) => async (error, req, res, next) => {
  if (hooks.beforeSend) {
    try {
      await hooks.beforeSend(req, res)
    } catch (beforeSendError) {
      return next(beforeSendError)
    }
  }
  if (res.headersSent) {
    return next(error)
  }
  res.status(500).send({
    error: error.message,
  })
  if (hooks.afterSend) {
    try {
      await hooks.afterSend(req, res)
    } catch (afterSendError) {
      return next(afterSendError)
    }
  }
}
