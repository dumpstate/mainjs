# @dumpstate/mainjs

Main script for nodejs apps.

## Install

Package is published to GitHub Packages NPM registry. Add to your `.npmrc`:

```
@dumpstate:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN_WITH_READ_PACKAGES_SCOPE>
```

install package:

```sh
npm install @dumpstate/mainjs --save
```

## Usage

`@dumpstate/mainjs` is a convenience package to avoid interaction with `node:cluster`. It allows to declare the entrypoint scripts for the nodejs application, and then either start selected scripts or run all with `cluster.fork`.

e.g., `main.ts` script for a web application:

```ts
import { main } from "@dumpstate/mainjs"

main({
	entrypoints: {
		webserver: "./webserver",
		worker: "./worker",
	},
})
```

The application declares two entrypoints, `webserver` and a `worker`. The values of the configuration object are paths to actual nodejs scripts, as if you'd `require` them.

Once compiled and run:

```bash
node dist/main.js
```

both `webserver` and `worker` will run in child processes.

Selected entrypoints can be run by specifying the name:

```bash
node dist/main.js webserver
```

`@dumpstate/mainjs` optionally depends on `pino` - if not available `console` is being used for logging. A concrete instance of `logger` might be provided via config as well as the basic logger configuration.
