var fetchProgame = require('./fetchProgame').fetchProgame;
var db = require('../store/db');

fetchProgame(db, function(err)
{
	if (err)
	{
		console.log(err);
	}
});
