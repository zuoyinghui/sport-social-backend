const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN']

function normalizeOrigin(origin = '') {
  return origin.trim().replace(/\/+$/, '')
}

function parseCorsOrigins(value) {
  return value
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean)
}

function isOriginAllowed(origin, allowedOrigins) {
  const normalizedOrigin = normalizeOrigin(origin)
  return allowedOrigins.some((allowed) => {
    if (allowed.startsWith('*.')) {
      return normalizedOrigin.endsWith(allowed.slice(1))
    }
    return allowed === normalizedOrigin
  })
}

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`[ENV] 缺少必要环境变量: ${missing.join(', ')}`)
    process.exit(1)
  }
}

module.exports = {
  validateEnv,
  parseCorsOrigins,
  isOriginAllowed,
}
