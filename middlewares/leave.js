import redis from '../helpers/redis'
import jwt from 'jsonwebtoken'

export default async (ctx, next) => {

  try {
    const decoded = jwt.verify(ctx.headers['authorization'].split(' ')[1], 'secret');

    redis.hdel(decoded.id)

    await next();
  } catch(err) {
    ctx.body = {
      err,
    }
    ctx.status = 400
  }

};
