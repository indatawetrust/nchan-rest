/**
 * user schema
 *
 * @member user.schema
 */

const mongoose = require('mongoose'),
	   Schema   = mongoose.Schema,
	   ObjectId = Schema.Types.ObjectId

const UserSchema = new Schema({
	username 	: String,
	id 	: String,
	token 	: String,
	created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

exports.User = mongoose.model('User',UserSchema, 'user')
