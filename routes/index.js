const router = require('koa-router')(),
  request = require('../helpers/request'),
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
  Message = mongoose.model('Message');

router.get('/', async function(ctx, next) {
  ctx.body = `
		<!DOCTYPE html><html style="background: -webkit-linear-gradient(#136a8a, #267871);width:100%;height:100%;margin:0;padding:0;"><head><title>nchan-rest</title><meta name="viewport" content="initial-scale=1, maximum-scale=1"></head><body style="font-size:50px;color:#fff;font-weight:100;width:100%;height:100%;text-shadow:0px 0px 10px #fff;margin:0;padding:0;display:flex;align-items:center;justify-content:center;font-family:Sans-serif">nchan-rest</body></html>
	`;
});

router.post('join', keyControl, join, async function(ctx, next) {
  const {token} = ctx;

  ctx.body = {
    token,
    _id: ctx._id,
    ok: true,
  };
});

router.post('update', keyControl, jwtAuthorization, update, async function(
  ctx,
  next,
) {
  ctx.body = {
    ok: true,
  };
});

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

  if (message.user_id.equals(ctx._id)) {
    message.me = true;
  } else {
    message.me = false;
  }

  await request({
    channel: ctx.query.channel,
    message: body.message,
  });

  ctx.body = {
    ok: true,
  };
});

router.get('messages', keyControl, jwtAuthorization, async function(ctx, next) {
  try {
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

      delete room.users
      delete room.read
      delete room.seen

      rooms[i] = room;
    }

    ctx.body = {
      ok: true,
      rooms,
    };
  } catch (err) {
    console.log(err);
    ctx.throw(400, {
      err,
    });
  }
});

router.get('info/:id', keyControl, async function(ctx, next) {
  const {body} = ctx.request;

  await request({
    channel: ctx.query.channel,
    message: body.message,
  });

  ctx.body = {
    ok: true,
  };
});

router.get('leave', keyControl, leave, async function(ctx, next) {
  ctx.body = {
    ok: true,
  };
});

module.exports = router;
