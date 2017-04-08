const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const ejs = require('ejs');
const index = require('./routes/index');
const tongqu = require('./routes/tongqu');
const contact = require('./routes/contact');

const app = express();

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
const server = http.createServer(app).listen(app.get('port'), app.get('host'), function() {
    console.log(`Qingniao website server listening on port ${app.get('port')}　at host ${app.get('host')}`);
});

app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
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
