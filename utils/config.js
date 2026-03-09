const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN']

function parseCorsOrigins(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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
}
