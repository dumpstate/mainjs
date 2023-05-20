import cluster from "node:cluster"

import { Logger, LoggerConfig, newLogger } from "./logger"

export interface Config {
	entrypoints: Record<string, string>
	logger?: Logger
	loggerConfig?: LoggerConfig
}

export function main(cfg: Config) {
	const args = process.argv.slice(2)
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

		const { start } = require(cfg.entrypoints[entrypoint] as string)

		start()
	}

	if (args.length === 0) {
		// no arguments, starting all processes
		if (cluster.isPrimary) {
			for (const name of Object.values(cfg.entrypoints)) {
				cluster.fork({
					WORKER_NAME: name,
				})
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
	} else if (args.length === 1) {
		// single argument - starting selected worker
		run(args[0] as string)
	} else {
		logger.error("expected either no, or a single argument")
		process.exit(1)
	}
}
