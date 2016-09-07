/**
 * Form a queue of waiting list for save and load dem file from
 * server, with bzip2 as the tech to compress/decompress
 * and processors
**/
var config = require('../config');
var express = require('express');
var app = express();
var bzip = require('../store/bzip');
var port = config.PORT || config.STOREDEM_PORT;
var queue = require('../store/queue');
var db = require('../store/db');
var redis = require('../store/redis');
var sQueue = queue.getQueue('savedem');
var lQueue = queue.getQueue('loaddem');



