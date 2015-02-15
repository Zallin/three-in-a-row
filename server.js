var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('assets'));

app.get('/', function(req, res, next){
	res.sendFile(__dirname + '/public/index.html');
});

var server = app.listen(3000, function(){
	console.log('Ready 4 ur awesome requests');
});