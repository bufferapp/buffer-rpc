# buffer-rpc

[![Build Status](https://travis-ci.org/bufferapp/buffer-rpc.svg?branch=master)](https://travis-ci.org/bufferapp/buffer-rpc)

Buffer RPC request handler

## Error Handling

### Handled Flag

**createError** handled = true (customizable)

**errorMiddleware** handled = false

**method not found** handled = true

### Error Codes

**defaults**

1000 - createError default (customizable)
4040 - method not found (404)
5000 - unhandled exception (500)
