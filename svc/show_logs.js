var fs = require('fs');
var http = require('http');


http.createServer(function(req, res) {
	var stream = fs.createReadStream('/root/.pm2/logs/web-out.log');
	stream.pipe(res);
}).listen(3000);

