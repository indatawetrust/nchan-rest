import redis from '../helpers/redis'
import jwt from 'jsonwebtoken'
import uuidv1 from 'uuid/v1'

export default async (ctx, next) => {

  try {
    const id = uuidv1(),
        token = jwt.sign({ id }, 'secret'),
        {body} = ctx.request

    redis.hmset(id, Object.assign({
      token,
    }, body))

    ctx.token = token

    await next();
  } catch(err) {
    ctx.body = {
      err,
    }
    ctx.status = 400
  }

};
