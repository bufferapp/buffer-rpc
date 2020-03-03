const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request-promise')

const createServer = (handler, errorHandler) => {
  const app = express()
  app.use(bodyParser.json())
  if (errorHandler) {
    app.post('/rpc/:method?', handler, errorHandler)
  } else {
    app.post('/rpc/:method?', handler)
  }
  return http.createServer(app)
}

const stopServer = server => server.close()

const generateRequest = ({ url, name, args }) => {
  return request({
    uri: `${url}/rpc/${name}`,
    method: 'POST',
    body: {
      args: JSON.stringify(args),
    },
    json: true,
  })
}

module.exports = {
  createServer,
  stopServer,
  generateRequest,
}
