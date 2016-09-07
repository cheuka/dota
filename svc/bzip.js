/**
 * Form a queue of waiting list for zip and unzip
 * and processors
**/

var express = require('express')
var app = express();
var bzip = require('../store/bzip');
var port = config.PORT || config.BZIP_PORT;
var queue = require('../store/queue');

