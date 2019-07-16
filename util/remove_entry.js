var Queue = require('bull');
var metadbQueue = new Queue('execute pipeline', {
  redis: {
    host: 'redis',
    port: 6379
  }
});

var idToRemove = TODO;
metadbQueue.getJob(idToRemove).then(x => x.remove().then(y => console.log("Job removed")));
