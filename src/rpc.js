/**
 * Compose our RPC Express route handler. (Typically `/rpc/:method?`).

 * If `methods` passed to this function is NOT an Array then we expect this was 
 * invoked with methods as each parameter, and so merge everything. E.g., this 
 * functions was called like so.
 * 
 *   rpc(methodOne, methodTwo, methodThree, ...);
 * 
 * Otherwise the first param should be an Array of methods and the second an
 * Object to pass as utilities / dependencies for the RPC methods. E.g.,
 *  
 *   rpc([methodOne, methodTwo, ...], { MyUtility, OtherUtil })
 * 
 * In the latter case, when RPC methods are called they will have access to the
 * utility Object via their last parameter. (See where `utils` is passed below.)
 * 
 * @returns Function  Handler for RPC requests
 */
module.exports = (methods, utils, ...rest) => {
  let allMethods = methods
  if (!Array.isArray(methods)) {
    allMethods = [methods, utils, ...rest].filter(i => i) // filter removes null / undefined
    utils = null
  }
  return (req, res, next) => {
    if (!req.body) {
      return next(
        new Error(
          'no req.body found, is app.use(bodyParser.json()) hooked up?',
        ),
      )
    }
    const { name: bodyName, args } = req.body
    // Try to get the method name from the URL first (e.g., /rpc/:method)
    // Fall back to checking header or POST body
    const name =
      req.params.method || req.headers['x-buffer-rpc-name'] || bodyName
    const matchingMethod = allMethods.find(method => method.name === name)
    if (name === 'methods') {
      res.send([
        {
          name: 'methods',
          docs: 'list all available methods',
        },
        ...allMethods.map(({ name, docs }) => ({
          name,
          docs,
        })),
      ])
    } else if (matchingMethod) {
      const parsedArgs = args ? JSON.parse(args) : []
      let promise
      try {
        const fnResult = Array.isArray(parsedArgs)
          ? matchingMethod.fn(...parsedArgs, req, res, utils)
          : matchingMethod.fn(parsedArgs, req, res, utils)
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
        if (error.rpcError) {
          const bugsnag = req.app.get('bugsnag')
          if (bugsnag) {
            bugsnag.notify(error)
          }
          res.status(error.statusCode || 400).send({
            error: error.message,
            code: error.code,
            handled: error.handled,
          })
        } else {
          next(error)
        }
      })
    } else {
      res.status(404).send({
        error: 'unknown method',
        code: 4040,
        handled: true,
      })
    }
  }
}
