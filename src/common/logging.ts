// Log level enum for controlling which logs are active
enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

// Current log level - can be changed at runtime
let currentLogLevel = LogLevel.DEBUG

function getCallerInfo() {
	return new Error().stack?.split('at ')[2]?.trim() ?? 'Unknown'
}

function shouldLog(level: LogLevel): boolean {
	return level >= currentLogLevel
}

function debug(...message: any[]) {
	if (shouldLog(LogLevel.DEBUG)) {
		console.log(`[DEBUG] ${getCallerInfo()}`, ...message)
	}
}

function info(...message: any[]) {
	if (shouldLog(LogLevel.INFO)) {
		console.log(`[INFO] ${getCallerInfo()}`, ...message)
	}
}

function warn(...message: any[]) {
	if (shouldLog(LogLevel.WARN)) {
		console.warn(`[WARN] ${getCallerInfo()}`, ...message)
	}
}

function error(...message: any[]) {
	if (shouldLog(LogLevel.ERROR)) {
		console.error(`[ERROR] ${getCallerInfo()}`, ...message)
	}
}

function fatal(...message: any[]): never {
  console.error(`[FATAL] ${new Error().stack}\n`, ...message)
  process.exit(1)
}

// Function to set the current log level
function setLogLevel(level: LogLevel) {
	currentLogLevel = level
}

export { debug, info, warn, error, fatal, setLogLevel, LogLevel }
