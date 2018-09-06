module.exports = (...methods) => (req, res, next) => {
  const { name: bodyName, args } = req.body
  const name = req.headers['x-buffer-rpc-name'] || bodyName
  const matchingMethod = methods.find(method => method.name === name)
  if (name === 'methods') {
    res.send([
      {
        name: 'methods',
        docs: 'list all available methods',
      },
    ])
  } else if (matchingMethod) {
    const parsedArgs = args ? JSON.parse(args) : []
    let promise
    try {
      const fnResult = Array.isArray(parsedArgs)
        ? matchingMethod.fn(...parsedArgs, req, res)
        : matchingMethod.fn(parsedArgs, req, res)
      // if async function set it to the promise
      if (fnResult.then) {
        promise = fnResult
      } else {
        // if sync function wrap in a resolved promise
        promise = Promise.resolve(fnResult)
      }
    } catch (error) {
      // sync failure, wrap in a rejected promise
      promise = Promise.reject(error)
    }
    // handle request the same for sync or async
    promise.then(result => res.send({ result })).catch(error => {
      if (error.handled) {
        res.status(error.statusCode || 400).send({
          error: error.message,
        })
      } else {
        next(error)
      }
    })
  } else {
    res.status(404).send({
      error: 'unknown method',
    })
  }
}
