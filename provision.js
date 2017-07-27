const json = require('jsonfile'),
      keygen = require("keygenerator")

const keys = {
  APP_ID: keygen._(),
  CLIENT_KEY: keygen._()
}

module.exports = () => {
  json.writeFileSync('key.json', keys)
}
