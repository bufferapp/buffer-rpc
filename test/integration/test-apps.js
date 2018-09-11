const express = require('express')
const { rpc, method } = require('../../src')

let noErrorHandler = express()
let withErrorInJson = express()
let withErrInJson = express()

const jsonParser = require('body-parser').json()

const rpcServer = (req, res, next) => {
  rpc(
    method('throws', () => {
      throw new Error('Mock Unexpected Error')
    })
  )(req, res, next)
}

noErrorHandler.post('/rpc', jsonParser, rpcServer)
withErrorInJson.post('/rpc', jsonParser, rpcServer)
withErrInJson.post('/rpc', jsonParser, rpcServer)

// error handling to return json
withErrorInJson.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({error: err.message})
})

withErrInJson.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({err: err.message})
})

module.exports = {
  noErrorHandler,
  withErrorInJson,
  withErrInJson,
}
