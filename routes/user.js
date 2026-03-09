const express = require('express')
const jwt = require('jsonwebtoken')
const { body, param } = require('express-validator')
const User = require('../models/User')
const authMiddleware = require('../middlewares/auth.middleware')
const validateRequest = require('../utils/validate')
const { success, failure } = require('../utils/response')

const phoneReg = /^1\d{10}$/
const router = express.Router()

const registerValidators = [
  body('username').notEmpty().withMessage('username 为必填项'),
  body('phone')
    .notEmpty()
    .withMessage('phone 为必填项')
    .bail()
    .matches(phoneReg)
    .withMessage('手机号格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少 6 位'),
  body('sportType').notEmpty().withMessage('sportType 为必填项'),
  body('location.latitude').optional().isFloat().withMessage('latitude 必须是数字'),
  body('location.longitude').optional().isFloat().withMessage('longitude 必须是数字'),
]

router.post('/register', registerValidators, validateRequest, async (req, res) => {
  try {
    const { username, phone, password, sportType, location } = req.body

    const existedByPhone = await User.findOne({ phone })
    if (existedByPhone) {
      return failure(res, '手机号已存在', 409)
    }
    const existedByUsername = await User.findOne({ username })
    if (existedByUsername) {
      return failure(res, '用户名已存在', 409)
    }

    const user = await User.create({
      username,
      phone,
      password,
      sportType,
      location,
    })

    return success(
      res,
      {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          sportType: user.sportType,
          location: user.location,
        },
      },
      '注册成功',
      200,
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return failure(res, `注册失败: ${error.message}`, 500)
    }
    return failure(res, '注册失败，请稍后重试', 500)
  }
})

router.post(
  '/login',
  [
    body('phone').notEmpty().withMessage('phone 为必填项').bail().matches(phoneReg).withMessage('手机号格式不正确'),
    body('password').notEmpty().withMessage('password 为必填项'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { phone, password } = req.body
      const user = await User.findOne({ phone })
      if (!user) {
        return failure(res, '手机号或密码错误', 401)
      }

      const matched = await user.comparePassword(password)
      if (!matched) {
        return failure(res, '手机号或密码错误', 401)
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return success(
        res,
        {
          token,
          user: {
            _id: user._id,
            username: user.username,
            phone: user.phone,
            avatar: user.avatar,
            sportType: user.sportType,
            location: user.location,
          },
        },
        '登录成功',
        200,
      )
    } catch (error) {
      return failure(res, '登录失败，请稍后重试', 500)
    }
  },
)

router.get('/info', authMiddleware, async (req, res) => {
  return success(res, { user: req.user }, 'success', 200)
})

router.get(
  '/public/:userId',
  authMiddleware,
  [param('userId').notEmpty().withMessage('userId 为必填项')],
  validateRequest,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select('username avatar sportType location createdAt')
      if (!user) {
        return failure(res, '用户不存在', 404)
      }
      return success(res, { user }, 'success', 200)
    } catch (error) {
      return failure(res, '获取用户信息失败', 500)
    }
  },
)

router.put(
  '/profile',
  authMiddleware,
  [
    body('username').optional().notEmpty().withMessage('username 不能为空'),
    body('avatar').optional().isString().withMessage('avatar 必须是字符串'),
    body('sportType').optional().notEmpty().withMessage('sportType 不能为空'),
    body('location.latitude').optional().isFloat().withMessage('latitude 必须是数字'),
    body('location.longitude').optional().isFloat().withMessage('longitude 必须是数字'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, avatar, sportType, location } = req.body
      const update = {}
      if (username !== undefined) update.username = username
      if (avatar !== undefined) update.avatar = avatar
      if (sportType !== undefined) update.sportType = sportType
      if (location !== undefined) update.location = location

      if (username && username !== req.user.username) {
        const existedByUsername = await User.findOne({ username })
        if (existedByUsername) {
          return failure(res, '用户名已存在', 409)
        }
      }

      const updated = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password')
      return success(res, { user: updated }, '个人信息更新成功', 200)
    } catch (error) {
      return failure(res, '更新个人信息失败', 500)
    }
  },
)

router.put(
  '/password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('oldPassword 为必填项'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少 6 位'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body
      const user = await User.findById(req.user._id)
      const matched = await user.comparePassword(oldPassword)
      if (!matched) {
        return failure(res, '旧密码错误', 401)
      }
      user.password = newPassword
      await user.save()
      return success(res, {}, '密码修改成功', 200)
    } catch (error) {
      return failure(res, '密码修改失败', 500)
    }
  },
)

module.exports = router
