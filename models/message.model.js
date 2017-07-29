/**
 * Message schema
 *
 * @member Message.schema
 */

const mongoose = require('mongoose'),
     Schema   = mongoose.Schema,
     ObjectId = Schema.Types.ObjectId

const MessageSchema = new Schema({
  user_id   : String,
  room_id : ObjectId,
  text : String,
  seen: [{
     user_id: String,
     is: Boolean
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

exports.Message = mongoose.model('Message',MessageSchema, 'message')
