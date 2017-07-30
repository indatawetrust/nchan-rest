import redis from '../helpers/redis';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const User = mongoose.model('User');

export default async (ctx, next) => {
  try {
    const decoded = jwt.verify(
      ctx.headers['authorization'].split(' ')[1],
      'secret',
    );

    const user = await User.findOne({
      id: decoded.id,
    });

    if (!user) throw 'user not found';

    ctx.id = decoded.id;
    ctx._id = user._id;

    await next();
  } catch (err) {
    ctx.body = {
      err,
    };
    ctx.status = 400;
  }
};
