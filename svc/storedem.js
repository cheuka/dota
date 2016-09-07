/**
 * Form a queue of waiting list for zip and unzip
 * and processors
**/
var config = require('../config');
var express = require('express');
var app = express();
var bzip = require('../store/bzip');
var port = config.PORT || config.BZIP_PORT;
var queue = require('../store/queue');
var db = require('../store/db');
var redis = require('../store/redis');
var sQueue = queue.getQueue('savedem');
var lQueue = queue.getQueue('loaddem');
