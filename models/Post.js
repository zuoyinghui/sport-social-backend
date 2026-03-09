const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  content: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  sportType: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Post', postSchema)
