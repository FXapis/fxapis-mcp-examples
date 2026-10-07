# Contributing

See the [Contributing section](README.md#contributing) in the README: in short, every config and
script here should be run against the live `https://api.fxapis.com/mcp` with a deliberately
invalid key before a pull request — you should get fxapis's real `401` back, which the `check`
workflow verifies automatically for the two scripts.

## Reporting a problem

Open an [issue](https://github.com/FXapis/fxapis-mcp-examples/issues) with the client, what you
changed or followed, and what happened. For an API or account issue rather than one with these
examples, email [support@fxapis.com](mailto:support@fxapis.com).
