//var fs = require('fs');
var http = require('http');
var cp = require('child_process');
var spawn = cp.spawn;


http.createServer(function(req, res) {
	//var stream = fs.createReadStream('/root/.pm2/logs/web-out.log');
	//stream.pipe(res);

	var tail = spawn('tail', [
			'-n',
			'500',
			'/root/.pm2/logs/web-out.log'
		],
		{
			stdio: ['pipe', 'pipe', 'pipe'],
        	encoding: 'utf8'
		});
	tail.stdout.pipe(res);

}).listen(3000);

