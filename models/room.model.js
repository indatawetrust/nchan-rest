/**
 * Room schema
 *
 * @member Room.schema
 */

const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.Types.ObjectId;

const RoomSchema = new Schema({
  users: [String],
  seen: [
    {
      user_id: ObjectId,
      is: Boolean,
    },
  ],
  read: [
    {
      user_id: ObjectId,
      is: Boolean,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

exports.Room = mongoose.model('Room', RoomSchema, 'room');
