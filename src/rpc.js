module.exports = (...methods) => async (req, res, next) => {
  const { name } = req.body
  const matchingMethod = methods.find(method => method.name === name)
  if (name === 'methods') {
    res.send([
      {
        name: 'methods',
        docs: 'list all available methods',
      },
    ])
  } else if (matchingMethod) {
    let fnResult
    try {
      fnResult = matchingMethod.fn()
    } catch (error) {
      // handle sync expected failure
      return next(error)
    }
    if (fnResult.then) {
      // handle async
      fnResult.then(result => res.send({ result })).catch(error => next(error))
    } else {
      res.send({ result: fnResult })
    }
  } else {
    res.status(404).send({
      error: 'unknown method',
    })
  }
}
