var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    consolidate = require('consolidate'),
    wiki = require("./lib/app.js");

// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
      layout: 'layout'
    });
    app.engine('.jade', consolidate.jade);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Add Main methods
for(method in wiki){
    if(method != 'page' && method != 'editor') {
        console.log('Adding endpoint ' + method);
        app.get('/' + method, wiki[method]);
        app.post('/' +method, wiki[method]);
    }
}

// App routing
function app_router(req, res) {
    var route = req.params[0].split('/');
    var app = require('./lib/app/' + route[0] + '/routes.js');
    app[route[1]](req, res);
}
app.get( /app\/_\/(.*)/, app_router);
app.post( /app\/_\/(.*)/, app_router);

// Add Extra methods
app.use('/app/', express.static(__dirname+'/lib/app/'));

// View Pages
app.get('/', function(req, res){
    req.params['page'] = 'index';
    wiki['page'](req, res);
});
app.get('/:page', wiki['page']);

// Editor
app.get('/edit/:page', wiki['editor']);
app.post('/edit/:page', wiki['editor']);

var port = process.env.PORT || 5003;

server.listen(port);
console.log('Server listen on: http://localhost:'+port);