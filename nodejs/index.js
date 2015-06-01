var express = require('express');
var multer = require('multer');
//var crypto = require('crypto');
var csv = require('csv');
var fs = require('fs');
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var http = require('http');

var app = express();
var done = false;

/*
   flow call:

   GET /upload => upload page
   POST => /upload

   present all columns and allow for selection of which column should have which meaning
   i.e.
    parser.add_argument('-k', '--idx-key', help='Column for Key', type=int)
    parser.add_argument('-q', '--idx-question', help='Column for Question', type=int, required=True)
    parser.add_argument('-i', '--idx-importance', help='Column for Importance', type=int)
    parser.add_argument('-r', '--idx-response', help='Column for Response', type=int, required=True)
    parser.add_argument('-c', '--idx-comment', help='Column for Comment', type=int)

    parser.add_argument('-s', '--skip-rows', help='Skip this many rows', type=int)

    */

/*jslint white: true */
/*jslint unparam: true */
/*jslint evil: true */ // TODO(ice): figure out a way to not use eval

// Constants
var PORT = 8080;
var ES_HOST = 'es:9200';

// App
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));

app.use(multer({ dest: './uploads/',
  rename: function(fieldname, filename) {
    return filename + Date.now();
  },
  onFileUploadStart: function(file) {
    console.log(file.originalname + ' is starting ...');
  },
  onFileUploadComplete: function(file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path);
    done = true;
  }
  }));

/*
app.get('/', function(req, res) {
  res.sendFile(__dirname + "/static/upload.html");
});

app.get('/list', function(req, res) {
  res.sendFile(__dirname + "/static/list.html");
});
*/

app.get('/api/list', function(req, res) {
  var client;
  var key;
  var rfxes;

  res.setHeader('Content-Type', 'application/json');

  client = new elasticsearch.Client({
    host: ES_HOST //,
//    log: 'trace'
  });

  rfxes = [];
  client.indices.getMapping({index: 'rfxsearch_v1'}, function(error, result, response) {
    if(error === undefined) {
//      console.log(result);

      for (key in result.rfxsearch_v1.mappings) { 
        if (result.rfxsearch_v1.mappings.hasOwnProperty(key)) {
//          console.log(key);
          rfxes.push([key, '?']);
        }
      }
//      console.log(rfxes);

      res.write(JSON.stringify({status:'success', error: error, response: JSON.stringify(rfxes)}));
      res.end();
    }
    else {
      res.write(JSON.stringify({status:'error', error: error, response: ""}));
      res.end();
    }
  });
});

app.post('/api/delete', function(req, res) {
  var request;
  var options;
  var data;

  console.log('deleting "' + req.body.deleteRFx + '"');
  res.setHeader('Content-Type', 'application/json');

  options = {
    host: ES_HOST.split(':')[0],
    port: ES_HOST.split(':')[1],
    path: '/rfxsearch_v1/' + encodeURIComponent(req.body.deleteRFx),
    method: 'DELETE'
  };
//  console.log(options);

  request = http.request(options, function(result) {
//    console.log('STATUS: ' + result.statusCode);
//    console.log('HEADERS: ' + JSON.stringify(result.headers));
    result.setEncoding('utf8');
    result.on('data', function (chunk) {
//      console.log('BODY: ' + chunk);

      data = JSON.parse(chunk);
//      console.log(data);
      if (data.acknowledged === true) {
        res.write(JSON.stringify( {status:'success', error: null, response: {rfx: req.body.deleteRFx}} ));
        res.end();
      }
      else {
        res.write(JSON.stringify( {status:'error', error: 'unknown response, ' + JSON.stringify(chunk)}));
        res.end();
      }
    });
  });

  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);

    res.write(JSON.stringify( {status:'error', error: e.message, response: e} ));
    res.end();
  });

  request.end();
});

app.post('/api/upload', function(req, res) {
  if (done === true) {
    res.setHeader('Content-Type', 'application/json');
    var filedata = fs.readFileSync(req.files.importFile.path); // TODO(icebnd): remove synchronous

    csv.parse(filedata, function(err, data) {
      res.write(JSON.stringify(data));
      res.end();
    });
  }
});

app.post('/api/import', function(req, res) {
  //console.log(req.body)

  var ES_INDEX = "rfxsearch_v1";

  var table = JSON.parse(req.body.table);
  var rfxName = req.body.rfxName;
  var rfxUrl = req.body.rfxUrl;
  var skipRows = parseInt(req.body.skipRows, 10);
  var idxKey = null;
  var idxQuestion = null;
  var idxImportance = null;
  var idxResponse = null;
  var idxComment = null;

  var i;
  var col;
  var client;
  var rfxBody;
  var row;
  var doc;

  // convert from col[0-9] to var idx*
  for (i = 0; i < 50; i++) {
    col = eval("req.body.col" + i);
    if (col !== undefined) {
      switch(col) {
        case "key":
          idxKey = i;
          break;
        case "question":
          idxQuestion = i;
          break;
        case "importance":
          idxImportance = i;
          break;
        case "response":
          idxResponse = i;
          break;
        case "comment":
          idxComment = i;
          break;
      }
    } else {
      break;
    }
  }
//  console.log("k", idxKey, "q", idxQuestion, "i", idxImportance, "r", idxResponse, "c", idxComment);
  if (!idxResponse && !idxQuestion) {
    res.write(JSON.stringify({status:'error', error: {message: 'must select at least Response and Question.'}}));
    res.end();
    return;
  }

  client = new elasticsearch.Client({
    host: ES_HOST //, // TODO(ice): add configuration parameter 
//    log: 'trace'
  });

  rfxBody = [];
  for (i = 0; i < table.length; i++) {
    row = table[i]; // TODO(icebnd): add happy iso -> utf8 decoding
//    console.log(row);

    if (i >= skipRows && row[idxQuestion] && row[idxResponse]) {
      doc = {
        'Question': row[idxQuestion],
        'Response': row[idxResponse],
        'URL': rfxUrl
      };

      if (idxKey !== null) {
        doc.Key = row[idxKey];
      } else {
        doc.Key = i;
      }
      if (idxComment !== null) {
        doc.Comment = row[idxComment];
      }
      if (idxImportance !== null) {
        doc.Importance = row[idxImportance];
      }

      rfxBody.push({index: {_index: ES_INDEX, _type: rfxName}});
      rfxBody.push(doc);
    }
//    else {
//      console.log(i, skipRows, idxQuestion, idxResponse);
//      console.log("skipping row", i, i < skipRows, !row[idxQuestion], !row[idxResponse]);
//    }
  }

  //console.log(rfxBody);

  client.bulk({
    body: rfxBody
  }, function (error, response) {
      if (error) {
//        console.log("es bulk error,", error, response);
        res.write(JSON.stringify({status:'error', error: error, response: response}));
        res.end();
      } else {
//        console.log("es bulk success,", response);
        res.write(JSON.stringify({status:'success', error: error, response: response}));
        res.end();
      }
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function(){
  console.log("Working on port", PORT);
});
