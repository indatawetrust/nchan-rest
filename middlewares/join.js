import redis from '../helpers/redis';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import uuidv1 from 'uuid/v1';

const User = mongoose.model('User');

export default async (ctx, next) => {
  try {
    const id = uuidv1(), token = jwt.sign({id}, 'secret'), {body} = ctx.request;

    const user = await new User(
      Object.assign(
        {
          id,
          token,
        },
        body,
      ),
    ).save();

    ctx.token = token;
    ctx._id = user._id;

    await next();
  } catch (err) {
    ctx.body = {
      err,
    };
    ctx.status = 400;
  }
};
