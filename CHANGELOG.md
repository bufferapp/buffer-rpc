# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]
### Added
- `buffer-rpc` can now receive calls in the form of `endpoint/:methodName` to allow for clearer debugging and tracing (e.g., in Chrome DevTools and DataDog). The previous method of passing the name to the RPC endpoint as one of the JSON body parameters **is still supported** but the method name in the URI takes precedence. 

To upgrade your application do the following:

1. In your server, upgrade `@bufferapp/buffer-rpc` to version `1.0.0`.
2. If your front-end app uses `@bufferapp/async-data-fetch` then upgrade that to version `2.0.0`.
3. If your front-end uses the RPC Client directly, then upgrade `@bufferapp/micro-rpc-client` to version `1.0.0`.
4. In your express server, change the route handler for your RPCs to support the new `:method` wildcard. For example, from this:

```
// ❌
app.post('/rpc', checkToken, rpcHandler, errorMiddleware);
```

  To this:

```
// ✅
app.post('/rpc/:method?', checkToken, rpcHandler, errorMiddleware);
```

5.  If you have a `checkToken` method as in the one above, you'll also need to update that. From this:

```
// ...
module.exports = (req, res, next) => {
  const { name } = req.body;
```

  To this:

```
// ...
module.exports = (req, res, next) => {
  const name = req.params.method ? req.params.method : req.body.name;
```

## [Unreleased]
### Added
- Integration tests for [micro-rpc-client](https://github.com/bufferapp/micro-rpc-client) error handling

### Changed
- README update

## [0.0.4] - 2018-10-10
### Added
- Error handler middleware

## [0.0.3] - 2018-10-04
### Added
- Optional custom error code

## [0.0.2] - 2018-09-11

- Initial public release
