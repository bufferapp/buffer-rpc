module.exports = () => (req, res) => {
  if (req.body.name === 'methods') {
    return res.send([
      {
        name: 'methods',
        docs: 'list all available methods',
      },
    ])
  }
  res.status(404).send({
    error: 'unknown method',
  })
}
