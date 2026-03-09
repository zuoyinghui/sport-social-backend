const express = require('express')
const multer = require('multer')
const OSS = require('ali-oss')
const path = require('path')
const fs = require('fs/promises')
const authMiddleware = require('../middlewares/auth.middleware')
const { success, failure } = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

function getExtension(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'video/mp4') return 'mp4'
  return ''
}

function createOssClient() {
  return new OSS({
    accessKeyId: process.env.OSS_ACCESS_KEY,
    accessKeySecret: process.env.OSS_SECRET_KEY,
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
  })
}

function hasOssConfig() {
  return Boolean(
    process.env.OSS_ACCESS_KEY &&
      process.env.OSS_SECRET_KEY &&
      process.env.OSS_REGION &&
      process.env.OSS_BUCKET,
  )
}

async function saveFileLocally(objectName, buffer) {
  const uploadRoot = path.join(__dirname, '..', 'uploads')
  const localFilePath = path.join(uploadRoot, objectName)
  await fs.mkdir(path.dirname(localFilePath), { recursive: true })
  await fs.writeFile(localFilePath, buffer)
}

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return failure(res, '请上传文件', 400)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4']
    if (!allowedTypes.includes(req.file.mimetype)) {
      return failure(res, '仅支持 jpg/png/mp4 格式', 400)
    }

    const ext = getExtension(req.file.mimetype)
    if (!ext) {
      return failure(res, '文件类型不支持', 400)
    }

    const random = Math.floor(Math.random() * 1000000)
    const objectName = `post/${Date.now()}-${random}.${ext}`
    let fileUrl = ''

    if (hasOssConfig()) {
      const client = createOssClient()
      const result = await client.put(objectName, req.file.buffer)
      fileUrl = result.url
    } else {
      await saveFileLocally(objectName, req.file.buffer)
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${objectName}`
      logger.warn('OSS config missing, file saved locally', { fileUrl })
    }

    return success(res, { url: fileUrl, name: objectName }, '上传成功', 200)
  } catch (error) {
    logger.error('OSS upload error', { message: error.message })
    return failure(res, '文件上传失败', 500)
  }
})

module.exports = router
