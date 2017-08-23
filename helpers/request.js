const rp = require('request-promise')

export default ({message, channel, type}) => {

  const body = {}

  body.type = type
  body.data = message

  return rp({
    method: 'POST',
    uri: `http://nchan/pub?id=${channel}`,
    body: JSON.stringify(body),
  })

}
