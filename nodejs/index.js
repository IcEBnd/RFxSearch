var express = require('express');
var multer = require('multer');
//var crypto = require('crypto');
var csv = require('csv');
var fs = require('fs');
var bodyParser = require("body-parser");
var elasticsearch = require('elasticsearch');

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

// Constants
var PORT = 8080;

// App
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ dest: './uploads/',
  rename: function(fieldname, filename) {
    return filename+Date.now();
  },
  onFileUploadStart: function(file) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function(file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path)
    done=true;
  }
}));

app.get('/', function(req,res){
  res.sendFile(__dirname + "/static/index.html");
});

app.get('/simple', function(req,res){
  res.sendFile(__dirname + "/static/simple.html");
});


app.post('/api/upload', function(req,res) {
  if (done == true) {
    res.setHeader('Content-Type', 'application/json');
    var filedata = fs.readFileSync(req.files.importFile.path); // TODO(icebnd): remove sync

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
  var skipRows = parseInt(req.body.skipRows);
  var idxKey = null;
  var idxQuestion = null;
  var idxImportance = null;
  var idxResponse = null;
  var idxComment = null;

  // convert from col[0-9] to var idx*
  for (var i = 0; i < 50; i++) {
    var col = eval("req.body.col" + i);
    if (typeof col != 'undefined') {
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

  var client = new elasticsearch.Client({
    host: '192.168.59.103:9200'//,
//    log: 'trace'
  });

  var rfxBody = []
  for (var i = 0; i < table.length; i++) {
    var row = table[i]; // TODO(icebnd): add happy iso -> utf8 decoding
//    console.log(row);

    if (i < skipRows || !row[idxQuestion] || !row[idxResponse]) {
//      console.log(i, skipRows, idxQuestion, idxResponse);
//      console.log("skipping row", i, i < skipRows, !row[idxQuestion], !row[idxResponse]);
      continue;
    }

    var doc = {
      'Question': row[idxQuestion],
      'Response': row[idxResponse],
      'URL': rfxUrl
    }
    if (idxKey) {
      doc['Key'] = row[idxKey]
    } else {
      doc['Key'] = i;
    }
    if (idxComment) {
      doc['Comment'] = row[idxComment];
    }
    if (idxImportance) {
      doc['Importance'] = row[idxImportance];
    }

    rfxBody.push({index: {_index: ES_INDEX, _type: rfxName}});
    rfxBody.push(doc);
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

app.listen(PORT, function(){
  console.log("Working on port", PORT);
});
