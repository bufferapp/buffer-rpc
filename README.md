# buffer-rpc

[![Build Status](https://travis-ci.org/bufferapp/buffer-rpc.svg?branch=master)](https://travis-ci.org/bufferapp/buffer-rpc)

Buffer RPC request handler

## Quickstart

Create a RPC method to add 2 numbers:

```js
// index.js
const express = require('express')
const { rpc, method } = require('@bufferapp/buffer-rpc')
const app = express()
app.use(bodyParser.json()) // this is required
app.post('/rpc/:method?', rpc(method('add', (a, b) => a + b)))
const port = 3000
app.listen(port, () => console.log(`App Is Listening On Port ${port}`))
```

Start the server

```sh
node index.js
```

Or you can use curl to call the `add` method:

```sh
curl -H "Content-Type: application/json" -X POST -d '{"args": "[2, 3]"}' localhost:3000/add | python -m json.tool

# {
#    "result": 5
# }
```

_Note: it is recommended that you use the RPC client:_

https://github.com/bufferapp/micro-rpc-client

To see a list of all available methods use the `methods` call:

```sh
curl -H "Content-Type: application/json" -X POST -d '{"name": "methods"}' localhost:3000 | python -m json.tool

# {
#   result: [
#     {
#       "docs": "add two numbers"
#       "name": "add"
#     },
#     {
#       "docs": "list all available methods",
#       "name": "methods"
#     }
#   ]
# }
```

## Usage

Here's a few examples of how to hook up the handler methods:

```js
const express = require('express')
const { rpc, method } = require('@bufferapp/buffer-rpc')
const app = express()
app.use(bodyParser.json()) // this is required

app.post(
  '/rpc/:method?',
  rpc(
    method('add', (a, b) => a + b),
    method(
      'addAsync',
      (a, b) =>
        new Promise(resolve => {
          resolve(a + b)
        }),
    ),
    method('addItems', ({ a, b }) => a + b),
    method(
      'addItemsAsync',
      ({ a, b }) =>
        new Promise(resolve => {
          resolve(a + b)
        }),
    ),
    method('throwError', () => {
      throw createError({ message: "I'm sorry I can't do that" })
    }),

    method(
      'throwErrorAsync',
      () =>
        new Promise((resolve, reject) => {
          reject(
            createError({
              message: 'Something is broke internally',
              statusCode: 500,
            }),
          )
        }),
    ),
    method(
      'documentation',
      `
  # documentation

  Document what a method does.
  `,
      () => 'documentation',
    ),
  ),
)

const port = 3000
app.listen(port, () => console.log(`App Is Listening On Port ${port}`))
```

## Dependency Injection

To simplify the code in your RPC methods, you may want to pass some common utilities down via simple dependancy injection. To do this, you call the `rpc()` method with slightly different syntax.

Instead of this (seen in the other README examples):

```js
rpc(methodOne, methodTwo, methodThree, ...);
```

Pass the methods as an `Array` and pass `utils` as a second parameter:

```js
rpc([methodOne, methodTwo, methodThree], utils);
```

Where `utils` is an `Object` that will be exposed to your RPC methods as the last parameter. For example, you might use it like this (example is simplified):

```js
// rpcHandler.js
const { rpc } = require('@bufferapp/buffer-rpc');

const PublishAPI = require('./publishAPI');
const myMethod = require('./myMethod');

module.exports = rpc([myMethod], { PublishAPI });

// myMethod.js
const { method } = require('@bufferapp/buffer-rpc');

module.exports = method(
  'myMethod',
  'myMethodDocs',
  (args, req, res, { PublishAPI }) => PublishAPI.fetch('/1/user.json')
);
```

## Error Handling

### Handled Flag

To help understand what the handled flag is for lets talk about a simplified distributed system. 

```
client -> server
```

The server is the RPC endpoints and the client is the source of the request, perhaps a browser or another service.. When handled = true this means there is nothing more for the client to do, when handled = false this means there _might_ be more work to resolve an issue. So handled = false is a maybe. An example of a definite handled = true is when you make a request to an RPC endpoint that does not exist. There's no partial state to resolve. An example of handled = false would be when you have to make multiple writes to a database, the first one passes and the second one fails. You've got a partially handled failure case. The client would be notified with a handled = false and then resolve the issue by either deleting the first record or writing the second -- depends on what the application does!

While this doesn't happen very often, it is more likely when we choose to use a NoSQL database since we don't have joins. That being said most of the time, you'll return an error with handled = true... especially if you're keeping RPC endpoints simple. Avoid distributed systems problems when you can!

**createError** handled = true (customizable)

**errorMiddleware** handled = false

**method not found** handled = true

### Error Codes

These are the default error codes for error type responses

**1000** - createError default (customizable)  
**4040** - method not found (404)  
**5000** - unhandled exception (500)

## API

### rpc

Takes a bunch of methods as arguments. Passes requests to right RPC endpoint

```js
rpc(...methods)
```

**...methods** - _method_ - rpc method (see below)

### method

add a remote method

```js
method(name, [docs], fn)
```

**name** - _string_ - the name of the method  
**docs** - _string_ - documentation about a method  
**fn** - _function_ - the function to call and apply parameters the method is requested

### createError

create an error to be thrown, optionally set the status code

```js
createError({
  message,
  code = 1000,
  statusCode = 400,
  handled = true,
})
```

**message** - _string_ - error message to return  
**code** - _integer_ - custom error code to add to response body HTTP status code (default to 1000)  
**statusCode** - _integer_ - HTTP status code (default to 400)
**handled** - _boolean_ - add if error was handled on backend to the response body (default to true)

### errorMiddleware

[express/connect error handling middleware](https://expressjs.com/en/guide/error-handling.html) that receives and unhandled error and returns a JSON response

```js
app.post('/rpc', rpc(method('awake', () => 'OK')), errorHandler)

/*
statusCode = 500
body = {
  handled: false,
  code: 5000,
  error: 'some error message' // set from error.message
}
*/
```

## Request and Response Objects

Request and response objects are always passed along as the last two arguments in case they're needed.

```js
method('addWithSession', (a, b, req, res) => {
  if (!req.session) {
    throw createError({ message: 'a session is needed to add numbers', statusCode: 401})
  }
  return a + b
}
```
