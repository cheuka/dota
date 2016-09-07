var queue = require('../store/queue');
var fpgQueue = queue.getQueue('fetchprogame');

queue.addToQueue(fpgQueue, null,
{
    attempts: 1
}, function(err, job)
{
    if (err)
    {
        console.error(err);
    }
    process.exit(err ? 1 : 0);
});
