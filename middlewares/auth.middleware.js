const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { failure } = require('../utils/response')

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) {
      return failure(res, '未提供有效 token', 401)
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.userId).select('-password')
    if (!user) {
      return failure(res, '用户不存在或 token 无效', 401)
    }
    req.user = user
    return next()
  } catch (error) {
    return failure(res, 'token 无效或已过期', 401)
  }
}

module.exports = authMiddleware
