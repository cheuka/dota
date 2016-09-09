var storedem = require('../svc/storedem');
var redis = require('../store/redis');
var queue = require('../store/queue');
var sQueue = queue.getQueue('storedem');
var pQueue = queue.getQueue('parse');
var rQueue = queue.getQueue('request');
var generateJob = require('../util/utility').generateJob;


doQ();

sQueue.process(function(job, cb)
{
	console.log('sQueue do work!');
	// console.log('sQueue processing:' + JSON.stringify(job));
	return cb('err');			
});


function doQ(){

	var poll = setInterval(function()
	{
		var timestamp = parseInt(Date.now() / 1000);
		console.log('storedem poll:' + timestamp);

		var qname = 'storedem';
		var payload = {
			url: 'http://localhost:5000/redis',
			dem_index: '123456'
		};
		var job = generateJob(qname, payload);		
		var options = {
			attempts: 1,
			backoff: {
				delay: 60 * 1000,
				type: 'exponential'
			}
		};
		sQueue.add(job, options).then(function(queuejob)
		{
			var jobId = queuejob.jobId;
			console.log('add:\n' + queuejob.jobId);

		});

/*
		console.log('add new job in sQueue');
		queue.addToQueue(sQueue, 
		{
			user_id: 'cheuka',
			dem_index: '111',
			is_public: '1',
			upload_time: '111'
		},
		{
			attempts: 1
		}, function(err, job)
		{
			console.log('timestamp:' + timestamp);
			console.log(JSON.stringify(job));

			console.log('get queue job');
			if(job){
				sQueue.getJob(job.jobId).then(function(job2)
				{
					console.log('get job:' + JSON.stringify(job2));
				});
			}

		});
*/

		console.log('getcounts');
		queue.getCounts(redis, function(err, obj){
			console.log('result:\n' + JSON.stringify(obj));
		});
		
				
	}, 5000);


}



