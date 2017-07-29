import redis from '../helpers/redis';
import jwt from 'jsonwebtoken';

export default async (ctx, next) => {
  try {
    const decoded = jwt.verify(
      ctx.headers['authorization'].split(' ')[1],
      'secret',
    );

    await new Promise((resolve, reject) => {
      redis.hgetall(decoded.id, (err, data) => {
        if (data.token != ctx.headers['authorization'].split(' ')[1]) reject(err);
console.log(data)
        resolve();
      });
    });

    ctx.id = decoded.id

    await next();
  } catch (err) {
    ctx.body = {
      err,
    };
    ctx.status = 400;
  }
};
