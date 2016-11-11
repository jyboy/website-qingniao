var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var http = require('http');
var ejs = require('ejs');
var index = require('./routes/index');
var tongqu = require('./routes/tongqu');
var contact = require('./routes/contact');
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/tongqu', express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/tongqu', tongqu);
app.use('/contact', contact);

app.set('port', process.env.PORT || 3000);
app.set('host', '127.0.0.1');
var server = http.createServer(app).listen(app.get('port'), app.get('host'), function() {
    console.log("Express server listening on port " + app.get('port')　 + " at host " + app.get('host'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('consolerror', {
        active: {
            index: '',
            tongqu: '',
            contact: 'active'
        },
        consolerror: {
            title: "404",
            content: err.message
        }
    });
});


module.exports = app;
