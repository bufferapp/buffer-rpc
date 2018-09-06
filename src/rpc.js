module.exports = (...methods) => async (req, res) => {
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
    const fnResult = matchingMethod.fn()
    if (fnResult.then) {
      fnResult.then(result => res.send({ result }))
    } else {
      res.send({ result: fnResult })
    }
  } else {
    res.status(404).send({
      error: 'unknown method',
    })
  }
}
