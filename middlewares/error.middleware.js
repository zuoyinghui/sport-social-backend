const { failure } = require('../utils/response')
const logger = require('../utils/logger')

function errorMiddleware(error, req, res, next) {
  if (error && error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return failure(res, '文件大小不能超过 10MB', 400)
    }
    return failure(res, '文件上传参数错误', 400)
  }

  if (error && error.message && error.message.startsWith('CORS blocked:')) {
    return failure(res, '跨域请求被拒绝', 403)
  }

  logger.error('Unhandled route error', { message: error.message, stack: error.stack })
  return failure(res, '服务器内部错误', 500)
}

module.exports = errorMiddleware
