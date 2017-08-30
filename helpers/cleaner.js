const rp = require('request-promise')

export default ({channel}) => {

  return rp({
    method: 'DELETE',
    uri: `http://nchan/pub?id=${channel}`
  })

}
