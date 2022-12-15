# strawman

> A Deno-based service virtualization solution

## ⚠⚠⚠ Still under development ⚠⚠⚠

This package is still under development. This message will disappear once the package is ready for testing.

## Docker

```yaml
version: "3"

services:
  strawman:
    container_name: strawman
    build:
      context: ..
      dockerfile: .docker/Dockerfile
    entrypoint: strawman start https://openformation.io
    ports:
      - 8080:8080
    volumes:
      - ../snapshots:/strawman/snapshots:rw
```

## LICENSE

![AGPLv3 Logo](./agplv3.png)

see [LICENSE](./LICENSE)
