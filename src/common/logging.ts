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

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
type StructuredMessages<T, S, D extends number = 10> = D extends 0
	? []
	: [] | [T, S, ...StructuredMessages<T, S, Prev[D]>]

function structure(...message: StructuredMessages<string, any>) {
	const obj: Record<string, any> = {}
	for (let i = 0; i < message.length; i += 2) {
		obj[message[i]] = message[i + 1]
	}
	return JSON.stringify(obj)
}

function debug(
	logMessage: string,
	...message: StructuredMessages<string, any>
) {
	if (shouldLog(LogLevel.DEBUG)) {
		console.log(
			`[DEBUG] ${getCallerInfo()}:`,
			logMessage,
			structure(...message)
		)
	}
}

function info(logMessage: string, ...message: StructuredMessages<string, any>) {
	if (shouldLog(LogLevel.INFO)) {
		console.log(`[INFO] ${getCallerInfo()}:`, logMessage, structure(...message))
	}
}

function warn(logMessage: string, ...message: StructuredMessages<string, any>) {
	if (shouldLog(LogLevel.WARN)) {
		console.warn(
			`[WARN] ${getCallerInfo()}:`,
			logMessage,
			structure(...message)
		)
	}
}

function error(
	logMessage: string,
	...message: StructuredMessages<string, any>
) {
	if (shouldLog(LogLevel.ERROR)) {
		console.error(
			`[ERROR] ${getCallerInfo()}:`,
			logMessage,
			structure(...message)
		)
	}
}

function fatal(
	logMessage: string,
	...message: StructuredMessages<string, any>
): never {
	console.error(
		`[FATAL] ${new Error().stack}\n`,
		logMessage,
		structure(...message)
	)
	process.exit(1)
}

// Function to set the current log level
function setLogLevel(level: LogLevel) {
	currentLogLevel = level
}

export { debug, info, warn, error, fatal, setLogLevel, LogLevel }
