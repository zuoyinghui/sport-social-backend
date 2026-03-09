const levelRank = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const currentLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level) {
  return levelRank[level] <= levelRank[currentLevel]
}

function format(level, message, extra) {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${extra ? ` ${JSON.stringify(extra)}` : ''}`
}

function log(level, message, extra) {
  if (!shouldLog(level)) return
  if (level === 'error') {
    console.error(format(level, message, extra))
    return
  }
  console.log(format(level, message, extra))
}

module.exports = {
  error: (message, extra) => log('error', message, extra),
  warn: (message, extra) => log('warn', message, extra),
  info: (message, extra) => log('info', message, extra),
  debug: (message, extra) => log('debug', message, extra),
}
