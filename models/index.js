const mongoose = require('mongoose')
const fs = require('fs')
mongoose.Promise = global.Promise;

mongoose.connect(`mongodb://mongo/nchan-rest`, (err) => {
	if (err) {
	}
})

try {

	const models = fs.readdirSync(__dirname).filter(model => model.match(/model/))

	for (let model of models) {
		exports[model.split('.')[0]] = require(`${__dirname}/${model}`)
	}

} catch(e ){

}
