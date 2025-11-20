export type LogMeta = Record<string, unknown>

function formatMeta(meta?: LogMeta): string {
  if (!meta || Object.keys(meta).length === 0) {
    return ""
  }

  try {
    return ` ${JSON.stringify(meta)}`
  } catch (error) {
    return ` ${String(error)}`
  }
}

function log(level: "info" | "warn" | "error" | "debug", message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString()
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`

  switch (level) {
    case "info":
      console.info(formattedMessage)
      break
    case "warn":
      console.warn(formattedMessage)
      break
    case "error":
      console.error(formattedMessage)
      break
    case "debug":
    default:
      console.debug(formattedMessage)
      break
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV !== "production") {
      log("debug", message, meta)
    }
  },
}
