const {APP_ID, CLIENT_KEY} = require('../key.json');

export default async (ctx, next) => {
  if (
    ctx.headers['app-id'] === APP_ID && ctx.headers['client-key'] === CLIENT_KEY
  ) {
    await next();
  } else {
    ctx.body = {
      error: 'APP_ID or CLIENT_KEY is incorrect'
    }
    ctx.status = 400
  }
};
