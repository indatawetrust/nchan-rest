const router = require('koa-router')(),
      request = require('../helpers/request');

router.post('message', async function (ctx, next) {
  const { body } = ctx.request

  await request({
    channel: ctx.query.channel,
    message: body.message
  })

  ctx.body = {
    ok: true
  }
})

module.exports = router;
