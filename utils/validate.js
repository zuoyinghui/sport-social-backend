const { validationResult } = require('express-validator')
const { failure } = require('./response')

function validateRequest(req, res, next) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  return failure(
    res,
    '参数校验失败',
    400,
    errors.array().map((item) => ({ field: item.path, message: item.msg })),
  )
}

module.exports = validateRequest
