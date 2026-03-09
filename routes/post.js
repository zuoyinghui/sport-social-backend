const express = require('express')
const mongoose = require('mongoose')
const { body, query, param } = require('express-validator')
const Post = require('../models/Post')
const authMiddleware = require('../middlewares/auth.middleware')
const validateRequest = require('../utils/validate')
const { success, failure } = require('../utils/response')

const router = express.Router()

router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('title 不能为空').isLength({ max: 80 }).withMessage('title 不能超过 80 个字符'),
    body('content').notEmpty().withMessage('content 不能为空'),
    body('images').optional().isArray().withMessage('images 必须是数组'),
    body('sportType').notEmpty().withMessage('sportType 为必填项'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { title, content, images = [], sportType } = req.body
      const post = await Post.create({
        author: req.user._id,
        title,
        content,
        images,
        sportType,
      })
      return success(res, { post }, '发布成功', 200)
    } catch (error) {
      return failure(res, '发布动态失败', 500)
    }
  },
)

router.get(
  '/list',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page 必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 50 }).withMessage('size 必须是 1-50 的整数'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = Number(req.query.page || 1)
      const size = Number(req.query.size || 10)

      const list = await Post.find({})
        .populate('author', 'username avatar sportType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)

      return success(res, { list, page, size }, 'success', 200)
    } catch (error) {
      return failure(res, '获取动态列表失败', 500)
    }
  },
)

router.get(
  '/my',
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
      const list = await Post.find({ author: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)

      return success(res, { list, page, size }, 'success', 200)
    } catch (error) {
      return failure(res, '获取我的动态失败', 500)
    }
  },
)

router.get(
  '/user/:userId',
  authMiddleware,
  [
    param('userId').notEmpty().withMessage('userId 为必填项'),
    query('page').optional().isInt({ min: 1 }).withMessage('page 必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 50 }).withMessage('size 必须是 1-50 的整数'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return failure(res, 'userId 格式不正确', 400)
      }

      const page = Number(req.query.page || 1)
      const size = Number(req.query.size || 10)
      const list = await Post.find({ author: userId })
        .populate('author', 'username avatar sportType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)

      return success(res, { list, page, size }, 'success', 200)
    } catch (error) {
      return failure(res, '获取用户动态失败', 500)
    }
  },
)

module.exports = router
