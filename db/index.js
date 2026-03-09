const mongoose = require('mongoose')
const logger = require('../utils/logger')

let reconnectTimer = null

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('MongoDB connected')
  } catch (error) {
    logger.error('MongoDB connect failed', { message: error.message })
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null
    await connectMongo()
  }, 5000)
}

function setupMongoEvents() {
  mongoose.connection.on('connected', () => logger.info('MongoDB connection status: connected'))
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected, trying reconnect...')
    scheduleReconnect()
  })
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { message: error.message })
  })
}

function getDbStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] || 'unknown'
}

module.exports = {
  connectMongo,
  setupMongoEvents,
  getDbStatus,
}
