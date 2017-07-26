const rp = require('request-promise')

export default ({message, channel}) => {

  return rp({
    method: 'POST',
    uri: `http://nchan/pub?id=${channel}`,
    body: JSON.stringify(message),
  })

}
