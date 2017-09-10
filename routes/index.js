const router = require('koa-router')(),
  request = require('../helpers/request'),
  cleaner = require('../helpers/cleaner'),
  {
    keyControl,
    jwtAuthorization,
    join,
    leave,
    update,
  } = require('../middlewares'),
  mongoose = require('mongoose'),
  Room = mongoose.model('Room'),
  User = mongoose.model('User'),
  Message = mongoose.model('Message'),
  shuff = require('shuff')({
    host: 'redis'
  });

router.get('/', async function(ctx, next) {
  ctx.body = `
		<!DOCTYPE html><html style="background: -webkit-linear-gradient(#136a8a, #267871);width:100%;height:100%;margin:0;padding:0;"><head><title>nchan-rest</title><meta name="viewport" content="initial-scale=1, maximum-scale=1"></head><body style="font-size:50px;color:#fff;font-weight:100;width:100%;height:100%;text-shadow:0px 0px 10px #fff;margin:0;padding:0;display:flex;align-items:center;justify-content:center;font-family:Sans-serif">nchan-rest</body></html>
	`;
});

/**
 * @api {post} /join join request
 * @apiName UserJoin
 * @apiGroup User
 *
 * @apiSuccess {String} token user jwt.
 * @apiSuccess {String} _id user _id.
 * @apiSuccess {Boolean} ok status.
 */
router.post('join', keyControl, join, async function(ctx, next) {
  const {token} = ctx;

  await shuff.add(ctx._id.toString())

  ctx.body = {
    token,
    _id: ctx._id,
    ok: true,
  };
});

/**
 * @api {post} /update update request
 * @apiName UserUpdate
 * @apiGroup User
 *
 * @apiParam {Object} update keys and values
 *
 * @apiSuccess {Object} changes.
 * @apiSuccess {Boolean} ok status.
 */
router.post('update', keyControl, jwtAuthorization, update, async function(
  ctx,
  next,
) {
  ctx.body = {
    changes: {},
    ok: true,
  };
});

/**
 * @api {get} /random random users
 * @apiName UserRandom
 * @apiGroup User
*
 * @apiSuccess {Array} users.
 * @apiSuccess {Boolean} ok status.
 */
router.get('random', keyControl, jwtAuthorization, async function(ctx, next) {
  try {

    let user_ids = await shuff.generate(5, ctx._id.toString()),
        users = [];

    for (let _id of user_ids) {
      let user = (await User.findOne({
        _id
      })).toObject()

      delete user.token

      users.push(user)
    }

    ctx.body = {
      users,
      ok: true
    }

  } catch (e) {
    ctx.throw(400, e)
  }
})

/**
 * @api {post} /message/:id message send
 * @apiName UserMessage
 * @apiGroup User
 *
 * @apiParam {String} id user id
 * @apiParam {String} text message text
 *
 * @apiSuccess {Boolean} ok status.
 */
router.post('message/:id', keyControl, jwtAuthorization, async function(
  ctx,
  next,
) {
  const {body} = ctx.request;

  let room = await Room.findOne({
    users: {
      $all: [ctx._id, ctx.params.id],
    },
  });

  if (!room) {
    room = await Room({
      users: [ctx._id, ctx.params.id],
      seen: [
        {
          user_id: ctx._id,
          is: true,
        },
        {
          user_id: ctx.params.id,
          is: true,
        },
      ],
      read: [
        {
          user_id: ctx._id,
          is: false,
        },
        {
          user_id: ctx.params.id,
          is: false,
        },
      ],
    }).save();
  } else {
    for (let user_id of room.seen.map(user => user.user_id)) {
      if (ctx._id.equals(user_id)) {
        await Room.update(
          {
            _id: room._id,
            'read.user_id': user_id,
          },
          {
            $set: {
              'read.$.is': false,
            },
          },
        );
      }
    }
  }

  let message = await Message({
    user_id: ctx._id,
    room_id: room._id,
    text: body.text,
    seen: [
      {
        user_id: ctx._id,
        is: true,
      },
      {
        user_id: ctx.params.id,
        is: true,
      },
    ],
    read: [
      {
        user_id: ctx._id,
        is: true,
      },
      {
        user_id: ctx.params.id,
        is: false,
      },
    ],
  }).save();

  await Room.update(
    {
      _id: room._id,
    },
    {
      $set: {
        updated_at: message.created_at,
      },
    },
  );

  message = message.toObject();

  message.me = true;

  let me = (await User.findOne({
    _id: ctx._id,
  })).toObject()

  delete me.token

  message.user = me;
  message.user.avatar = '#';

  delete message.seen;

  message.createdAt = message.created_at;

  await request({
    channel: ctx.params.id,
    message,
    type: 'NEW_MESSAGE'
  });

  ctx.body = {
    message,
    ok: true,
  };
});

/**
 * @api {get} /messages user messages
 * @apiName UserMessages
 * @apiGroup User
 *
 * @apiParam {Number} page room page
 *
 * @apiSuccess {Array} rooms rooms.
 * @apiSuccess {Boolean} ok status.
 */
router.get('messages', keyControl, jwtAuthorization, async function(ctx, next) {
  try {
    try {
      await cleaner({
        channel: ctx._id
      });
    } catch(e){}

    let page = ctx.query.page || 1;

    let rooms = await Room.find({
      users: {$in: [ctx._id]},
      seen: {
        $elemMatch: {
          user_id: ctx._id,
          is: true,
        },
      },
    })
      .sort({
        updated_at: -1,
      })
      .skip((parseInt(page) - 1) * 8)
      .limit(8);

    let total = await Room.count({
      users: {$in: [ctx._id]},
      seen: {
        $elemMatch: {
          user_id: ctx._id,
          is: true,
        },
      },
    });

    for (let i in rooms) {
      let room = rooms[i].toObject();

      for (let j in room.users) {
        if (ctx._id.equals(room.users[j])) {
          room.users.splice(j, 1);
        }
      }

      let user = room.users.shift();

      user = await User.findOne({
        _id: user,
      });

      user = user.toObject();

      room.user = user;

      let messages = Message.find({
        room_id: rooms[i]._id,
      }).sort({created_at: -1});

      messages = await messages.exec();

      if (messages.length) {
        room.last_message =
          messages[0].text.substr(0, 20) +
          (messages[0].text.length > 20 ? '...' : '');

        room.last_user_id = messages[0].user_id;
      }

      delete room.users;
      delete room.read;
      delete room.seen;

      room.numberOfUnreadMessages = 0;

      rooms[i] = room;
    }

    ctx.body = {
      ok: true,
      rooms,
    };
  } catch (err) {
    ctx.throw(400, {
      err,
    });
  }
});

/**
 * @api {get} /message/:id get room messages
 * @apiName UserRoomMessages
 * @apiGroup User
 *
 * @apiParam {Number} page room messages page
 *
 * @apiSuccess {Array} messages room messages.
 * @apiSuccess {Object} user user.
 * @apiSuccess {Number} page current page.
 * @apiSuccess {Number} totalPage room messages total page.
 * @apiSuccess {String} roomId room id.
 * @apiSuccess {Boolean} ok status.
 */
router.get('message/:id', keyControl, jwtAuthorization, async function(
  ctx,
  next,
) {
  try {
    let total = 0, page = ctx.query.page || 1;

    let room = await Room.findOne({
      users: {
        $all: [ctx._id, ctx.params.id],
      },
    });

    let me = await User.findOne({
      _id: ctx._id,
    }),
      you = await User.findOne({
        _id: ctx.params.id,
      });

    me = me.toObject();
    delete me.token;
    you = you.toObject();
    delete you.token;

    let messages = null;

    if (room && room.seen.filter(({user_id}) => ctx._id.equals(user_id))[0].is) {
      total = await Message.count({
        room_id: room._id,
        seen: {
          $elemMatch: {
            user_id: ctx._id,
            is: true,
          },
        },
      });

      messages = await Message.find({
        room_id: room._id,
        seen: {
          $elemMatch: {
            user_id: ctx._id,
            is: true,
          },
        },
      })
        .sort({created_at: -1})
        .skip((parseInt(page) - 1) * 8)
        .limit(8);

      for (let i in messages) {
        let message = messages[i].toObject();

        if (messages[i].user_id.equals(ctx._id)) {
          message.me = true;
          message.user = me;
          message.user.avatar = '#';
        } else {
          message.me = false;
          message.user = you;
          message.user.avatar = '#';
        }

        delete message.seen;

        message.createdAt = message.created_at;

        messages[i] = message;
      }
    } else {
      messages = [];
    }

    if (room) {
      let youID = room.users.filter(id => !id.equals(ctx._id))[0];

      await Room.update(
        {
          _id: room._id,
          'seen.user_id': ctx._id,
        },
        {
          $set: {
            'read.$.is': true,
          },
        },
        {
          new: true,
        },
      );
    }

    let user = await User.findOne({
      _id: ctx.params.id,
    });

    user = user.toObject();

    delete user.token;

    ctx.body = {
      messages,
      user,
      page,
      totalPage: Math.ceil(total / 8),
      roomId: room ? room._id : null,
      ok: true,
    };
  } catch (e) {
    ctx.throw(400, {
      error: e,
      ok: false,
    });
  }
});

/**
 * @api {delete} /message/:id delete message
 * @apiName UserMessageDelete
 * @apiGroup User
 *
 * @apiParam {String} id message id
 *
 * @apiSuccess {Boolean} ok status.
 */
router.delete('message/:id', keyControl, jwtAuthorization, async function(
  ctx,
  next,
) {
  try {
    const {id} = ctx.params;

    let message = await Message.findOne({
      _id: id,
    });

    if (!message) throw 'message not found';

    await Message.update(
      {
        _id: id,
        'seen.user_id': ctx._id,
      },
      {
        $set: {
          'seen.$.is': false,
        },
      },
    );

    const messageCount = await Message.find({
      room_id: message.room_id,
      seen: {
        $elemMatch: {
          user_id: ctx._id,
          is: true,
        },
      },
    });

    if (messageCount === 0)
      await Room.update(
        {
          _id: message.room_id,
          'seen.user_id': ctx._id,
        },
        {
          $set: {
            'seen.$.is': false,
          },
        },
      );

    ctx.body = {
      ok: true,
    };
  } catch (e) {
    ctx.throw(400, e);
  }
});

/**
 * @api {delete} /room/:id delete room
 * @apiName UserRoomDelete
 * @apiGroup User
 *
 * @apiParam {String} id room id
 *
 * @apiSuccess {Boolean} ok status.
 */
router.delete('room/:id', keyControl, jwtAuthorization, async function(
  ctx,
  next,
) {
  try {
    const {id} = ctx.params;

    let room = await Room.findOne({
      _id: id,
    });

    if (!room) throw 'room not found';

    await Room.update(
      {
        _id: id,
        'seen.user_id': ctx._id,
      },
      {
        $set: {
          'seen.$.is': false,
        },
      },
    );

    ctx.body = {
      ok: true,
    };
  } catch (e) {
    ctx.throw(400, e);
  }
});

/**
 * @api {get} /info/:id user info
 * @apiName UserInfo
 * @apiGroup User
 *
 * @apiParam {String} id user id
 *
 * @apiSuccess {Object} user user.
 * @apiSuccess {Boolean} ok status.
 */
router.get('info/:id', keyControl, async function(ctx, next) {
  const {body} = ctx.request;

  await request({
    channel: ctx.query.channel,
    message: body.message,
  });

  ctx.body = {
    user: {},
    ok: true,
  };
});

/**
 * @api {get} /leave leave user
 * @apiName UserLeave
 * @apiGroup User
 *
 * @apiSuccess {Boolean} ok status.
 */
router.get('leave', keyControl, jwtAuthorization, leave, async function(ctx, next) {
  ctx.body = {
    ok: true,
  };
});

module.exports = router;
