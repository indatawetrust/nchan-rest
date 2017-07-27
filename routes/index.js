const router = require('koa-router')(),
      request = require('../helpers/request'),
      {
        keyControl
      } = require('../middlewares');

router.get('/', async function (ctx, next) {
  ctx.body = `
		<!DOCTYPE html><html style="background: -webkit-linear-gradient(#136a8a, #267871);width:100%;height:100%;margin:0;padding:0;"><head><title>makiaj</title><meta name="viewport" content="initial-scale=1, maximum-scale=1"></head><body style="font-size:50px;color:#fff;font-weight:100;width:100%;height:100%;text-shadow:0px 0px 10px #fff;margin:0;padding:0;display:flex;align-items:center;justify-content:center;font-family:Sans-serif">nchan-rest</body></html>
	`
})

router.post('join', keyControl, async function (ctx, next) {


  ctx.body = {
    token: true
  }
})

router.post('message', keyControl, async function (ctx, next) {
  const { body } = ctx.request

  await request({
    channel: ctx.query.channel,
    message: body.message
  })

  ctx.body = {
    ok: true
  }
})

router.get('info/:id', keyControl, async function (ctx, next) {
  const { body } = ctx.request

  await request({
    channel: ctx.query.channel,
    message: body.message
  })

  ctx.body = {
    ok: true
  }
})

router.get('leave', keyControl, async function (ctx, next) {


  ctx.body = {
    ok: true
  }
})

module.exports = router;
