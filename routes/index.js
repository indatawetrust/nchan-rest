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
      $all: [ctx.id, ctx.params.id],
    },
  });

  if (!room) {
    room = await Room({
      users: [ctx.id, ctx.params.id],
      seen: [
        {
          user_id: ctx.id,
          is: true,
        },
        {
          user_id: ctx.params.id,
          is: true,
        },
      ],
      read: [
        {
          user_id: ctx.id,
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
      if (ctx.id != user_id) {
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
    user_id: ctx.id,
    room_id: room._id,
    text: body.text,
    seen: [
      {
        user_id: ctx.id,
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

  if (message.user_id == ctx.id) {
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
