const express = require('express')
const mongoose = require('mongoose')
const { query, param } = require('express-validator')
const authMiddleware = require('../middlewares/auth.middleware')
const User = require('../models/User')
const validateRequest = require('../utils/validate')
const { success, failure } = require('../utils/response')

const router = express.Router()

router.get(
  '/nearby',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page 必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 50 }).withMessage('size 必须是 1-50 的整数'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = Number(req.query.page || 1)
      const size = Number(req.query.size || 10)
      const me = await User.findById(req.user._id).populate('following', 'username avatar sportType location')
      const list = (me?.following || []).map((user) => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        sportType: user.sportType,
        location: user.location,
      }))

      const pagedList = list.slice((page - 1) * size, page * size)
      return success(res, { list: pagedList, page, size, total: list.length }, 'success', 200)
    } catch (error) {
      return failure(res, '获取关注列表失败', 500)
    }
  },
)

router.get(
  '/discover',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page 必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 50 }).withMessage('size 必须是 1-50 的整数'),
    query('keyword').optional().isString().withMessage('keyword 必须是字符串'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = Number(req.query.page || 1)
      const size = Number(req.query.size || 20)
      const keyword = (req.query.keyword || '').trim()

      const me = await User.findById(req.user._id).select('following')
      const excludedIds = [req.user._id, ...(me?.following || [])]

      const filter = { _id: { $nin: excludedIds } }
      if (keyword) {
        filter.username = { $regex: keyword, $options: 'i' }
      }

      const total = await User.countDocuments(filter)
      const list = await User.find(filter)
        .select('username avatar sportType location')
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)

      return success(res, { list, page, size, total }, 'success', 200)
    } catch (error) {
      return failure(res, '获取可关注用户失败', 500)
    }
  },
)

router.post(
  '/follow/:userId',
  authMiddleware,
  [param('userId').notEmpty().withMessage('userId 为必填项')],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return failure(res, 'userId 格式不正确', 400)
      }
      if (String(req.user._id) === String(userId)) {
        return failure(res, '不能关注自己', 400)
      }

      const target = await User.findById(userId).select('_id')
      if (!target) {
        return failure(res, '目标用户不存在', 404)
      }

      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: userId } })
      return success(res, {}, '关注成功', 200)
    } catch (error) {
      return failure(res, '关注失败，请稍后重试', 500)
    }
  },
)

router.delete(
  '/follow/:userId',
  authMiddleware,
  [param('userId').notEmpty().withMessage('userId 为必填项')],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return failure(res, 'userId 格式不正确', 400)
      }

      await User.findByIdAndUpdate(req.user._id, { $pull: { following: userId } })
      return success(res, {}, '已取消关注', 200)
    } catch (error) {
      return failure(res, '取消关注失败，请稍后重试', 500)
    }
  },
)

module.exports = router
