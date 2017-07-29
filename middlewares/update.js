import redis from '../helpers/redis'

export default async (ctx, next) => {

  try {
    const {body} = ctx.request

    await new Promise((resolve, reject) => {
      redis.hgetall(ctx.id, (err, data) => {
        if (err) reject(err)

        redis.hmset(ctx.id, Object.assign(data, body))

        resolve()
      });
    })

    await next();
  } catch(err) {
    ctx.body = {
      err,
    }
    ctx.status = 400
  }

};
