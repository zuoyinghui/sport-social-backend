const express = require('express')
const { getDbStatus } = require('../db')

const router = express.Router()

router.get('/', (req, res) => {
  const dbStatus = getDbStatus()
  return res.json({
    code: 200,
    msg: 'success',
    data: {
      status: 'ok',
      db: dbStatus === 'connected' ? 'connected' : dbStatus,
    },
  })
})

module.exports = router
