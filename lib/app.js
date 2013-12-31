var fs = require("fs"),
    marked = require("./marked.js"),
    path = require("path");

module.exports = app = {};

app['__about'] = function(req, res){
    res.render('about');
}

app['__help'] = function(req, res){
    res.render('help');
}

app['__gallery'] = function(req, res){
    fs.readdir("images", function(err, files){
        if(req.query['format'] == "editor"){
            res.render('editor-gallery', { files: files });
        } else{
            res.render('gallery', { files: files });
        }
    });
};

app['__pages'] = function(req, res) {
    fs.readdir('public/pages', function(err, files) {
        f = [];
        for(x in files) {
            f.push(files[x].substring(0, files[x].length - path.extname(files[x]).length));
        }
        if(req.query['format'] == 'editor') {
            res.render('editor-pages', { files: f });
        } else{
            res.render('pages', { files: f });
        }
    });
};

app['__gallery_delete'] = function(req, res) {
    if(req.query['sure']){
        fs.unlink( path.join("images", req.query['file']), function(err){
            res.redirect('__gallery?deleted=true');
        });
    } else{
        res.render('confirm-delete', { image: req.query['file'] });
    }
};

app['page'] = function(req, res) {
    var mOpt = { imageRoot: '/img/' };

    var page = req.params['page'];
    if(page == '') {
        page = 'index';
    }

    if(!fs.existsSync(path.join('public/pages', page + '.md'))) {
        res.status(404);
        res.render('404', { wikipage : page, request: 'view:' + page});
    } else{
        fs.readFile(path.join('public/pages', page + '.md'), function(err, contents) {
            if(err) {
                res.render('error', { error: err });
            } else{
                var words = contents.toString().split(' ').length;
                var rtime = Math.round(words / 20) / 10;
                context = {
                    contents: contents.toString(),
                    wikipage: page,
                    time: rtime,
                    words: words,
                    get: req.query
                };

                if(contents.toString().indexOf('[app') == 0){
                    context['appname'] = contents.toString().split("\n")[0].replace('[app ', '');
                    context['appname'] = context['appname'].substring(0, context['appname'].indexOf(']'));
                    res.render('page', context);
                } else {
                    context['contents'] = marked(contents.toString(), mOpt);
                    res.render('page', context);  
                }
            }
        });
    }
};

app['__apps'] = function(req, res){
    fs.readdir('lib/app', function(err, files) {
        res.render('apps', { files: files });
    });
};

app['__marked_script'] = function(req, res) {
    res.sendfile(path.join('lib', 'marked.js') );
};

app['__image'] = function(req, res){
    file = req.files['userfile'];

    file['name'] = file['name'].replace(" ", "_");

    rstream = fs.createReadStream(file['path']);
    wstream = fs.createWriteStream(path.join('img', file['name']));
    rstream.pipe(wstream);
    rstream.on("end", function(){
        res.end("![Image]("+ file['name'] +")");
    });
};

app['editor'] = function(req, res){
    var mOpt = { imageRoot: '/img/' };
    var page = req.params['page'];

    if(req.method == 'POST') {
        if( req.body['action'] == 'preview') {
            res.render('editor', {
                preview : marked(req.body['contents'], mOpt),
                contents: req.body['contents'],
                wikipage: page
            });
        } else {
            if(page == 'syntax') return;
            fs.writeFile(path.join('public/pages', page + '.md'), req.body['contents'], function(err) {
                if(!err) {
                    if(req.query['format'] == 'api') {
                        res.end('ok');
                    } else{
                        res.redirect(page + '?saved=true');
                    }
                } else {
                    if(req.query['format'] == 'api') {
                        res.end('failure');
                    } else{
                        res.render('error', { error: err });
                    }
                }
            });
        }
    } else {
        if(!fs.existsSync(path.join('public/pages', page + '.md'))) {
            res.render('editor', { wikipage: page });
        } else {
            var file = path.join('public/pages', page + '.md');
            fs.readFile(file, function(err, contents) {
                if(err) {
                    res.render('error', { error: err });
                } else{
                    context = { contents: contents, wikipage: page };
                    res.render('editor', context);
                }
            });
        }
    }
};
