const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request-promise')

const createServer = (handler, errorHandler) => {
  const app = express()
  app.use(bodyParser.json())
  app.post('*', handler)
  if (errorHandler) {
    app.use(errorHandler)
  }
  return http.createServer(app)
}

const generateRequest = ({ url, name, args }) =>
  request({
    uri: url,
    method: 'POST',
    body: {
      name,
      args: JSON.stringify(args),
    },
    json: true,
  })

module.exports = {
  createServer,
  generateRequest,
}
