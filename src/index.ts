import path from "path"
import cluster from "node:cluster"

import minimist from "minimist"

import { Logger, LoggerConfig, newLogger } from "./logger"

export interface Config {
	entrypoints: Record<string, string>
	logger?: Logger
	loggerConfig?: LoggerConfig
}

export function main(cfg: Config) {
	const argv = minimist(process.argv.slice(2))
	const logger = cfg.logger || newLogger(cfg.loggerConfig)

	function run(entrypoint: string) {
		if (!entrypoint) {
			logger.error("entrypoint expected")
			process.exit(1)
		}

		if (Object.keys(cfg.entrypoints).indexOf(entrypoint) < 0) {
			logger.error(`unknown entrypoint: ${entrypoint}`)
			process.exit(1)
		}

		const { start } = require(path.join(
			process.cwd(),
			argv["dist-dir"] || "",
			cfg.entrypoints[entrypoint] as string
		))

		start()
	}

	if (argv._.length === 0) {
		// no arguments, starting all processes
		if (cluster.isPrimary) {
			for (const name of Object.keys(cfg.entrypoints)) {
				const count = argv[`${name}-count`] || 1

				for (let i = 0; i < count; i++) {
					cluster.fork({
						WORKER_NAME: name,
					})
				}
			}

			cluster.on("exit", (worker) => {
				logger.info(`worker ${worker.process.pid} terminated`)

				for (const id in cluster.workers) {
					cluster.workers[id]?.kill()
				}
			})
		} else if (cluster.isWorker) {
			run(process.env["WORKER_NAME"] as string)
		}
	} else if (argv._.length === 1) {
		// single argument - starting selected worker
		run(argv._[0] as string)
	} else {
		logger.error(`unsupported command: ${argv._}`)
		process.exit(1)
	}
}
