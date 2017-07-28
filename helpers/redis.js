const redis = require("redis"),
      client = redis.createClient({
        host: 'redis'
      })

export default client
