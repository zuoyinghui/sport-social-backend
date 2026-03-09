require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectMongo, setupMongoEvents } = require('./db')
const { validateEnv, parseCorsOrigins } = require('./utils/config')
const { failure } = require('./utils/response')
const logger = require('./utils/logger')
const errorMiddleware = require('./middlewares/error.middleware')

const healthRouter = require('./routes/health')
const userRouter = require('./routes/user')
const postRouter = require('./routes/post')
const ossRouter = require('./routes/oss')
const matchRouter = require('./routes/match')

validateEnv()
setupMongoEvents()
connectMongo()

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/health', healthRouter)
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/oss', ossRouter)
app.use('/api/match', matchRouter)

app.use((req, res) => failure(res, '接口不存在', 404))
app.use(errorMiddleware)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  logger.info(`Server started on port ${port}`)
})
