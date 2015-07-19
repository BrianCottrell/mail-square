/* Mail Square        */
/* by Brian Cottrell  */
/* 07-18-2015         */

//Setup
var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var path = require('path');

var jsonParser = bodyParser.json();

var router = express.Router();
app.use(express.static(path.join(__dirname, '/views')));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

var port = process.env.PORT || 5000;

//Clusterpoint
//Includes
var cps = require('cps-api');

//Creating a CPS connection
var cpsConn = new cps.Connection(
    'tcp://cloud-eu-0.clusterpoint.com:9007',
    'square-mail',
    'brian.cottrell0@gmail.com',
    'angelhack1',
    'document',
    'document/id',
    {account: 1395}
);

//Debug
//cpsConn.debug = true;

//Insert
var storeEmail = function(data, sentBy){
    var id = Date.now(),
        content = data,
        sender = sentBy;
    var insert_request = new cps.InsertRequest('<document><id>'+id+'</id>'+cps.Term(content, "content")+cps.Term(sender, "sender")+'</document>');
    cpsConn.sendRequest(insert_request, function(err, insert_response) {
        if (err) return console.error(err);
       console.log('New email added: ' + insert_response.document[0].id);
    });
}

app.get('/', function(req, res){
    var search_req = new cps.SearchRequest("*", 0, 100);
    cpsConn.sendRequest(search_req, function (err, search_resp) {
        if (err) return console.log(err);
        console.log(search_resp.results.document);
        res.render('index.ejs', {'emails': search_resp.results.document});
    });
});

app.get('/email/:sender/:index', function(req, res){
    var emailIndex = parseInt(req.params.index.slice(7));
    console.log(emailIndex);
    var search_req = new cps.SearchRequest(cps.Term(req.params.sender.slice(8), "sender"), emailIndex, 1);
    cpsConn.sendRequest(search_req, function (err, search_resp) {
        if (err) return console.log(err);
        console.log(search_resp.results.document);
        res.render('email.ejs', {'email': search_resp.results.document[0], 'index': emailIndex});
    });
});

app.get('/compose',function(req,res){
    res.render('compose.ejs');
});

//Mailjet
//email account processing route
app.post('/email_processor', jsonParser, function(req, res) {
    storeEmail(JSON.stringify({
        'sender'    : req.body.Sender,
        'recipient' : req.body.Recipient,
        'date'      : req.body.Date,
        'from'      : req.body.From,
        'subject'   : req.body.Subject,
        'content'   : req.body['Text-part']
    }),
        req.body.Sender
    );
    console.log(req.body['Html-part']);
});

//SparkPost
"use strict";

var key = "734a0c281ffc0844d0822e6e67978672178b216e";
var SparkPost = require("sparkpost");
var client = new SparkPost(key);

app.post('/sparkpost_send', function(req, res) {
  console.log(req.body.recipient);
  console.log(req.body.subject);
	var reqOpts = {
		transmissionBody: {
			options: {
				open_tracking: true,
				click_tracking: true
			},
			campaign_id: "mailsquare_campaign",
			return_path: "mailsquare@mail.pxlbin.com",
			metadata: {
				user_type: "students"
			},
			substitution_data: {
				thumbnail_subject: req.body.subject,
				thumbnail_title: req.body.title,
				thumbnail_text: req.body.text,
				thumbnail_image1: req.body.image1,
                thumbnail_image2: req.body.image2,
                thumbnail_image3: req.body.image3,
                thumbnail_link1: req.body.link1,
                thumbnail_link2: req.body.link2,
                thumbnail_link3: req.body.link3,
				thumbnail_from:"mailsquare@mail.pxlbin.com"
			},
			recipients: [
				{
					return_path: "squaremail@mail.pxlbin.com",
					address: {
						email: req.body.recipient,
						name: "Square Mail"
					},
					tags: [
						"greeting",
						"welcome",
						"hello"
					],
					metadata: {
						place: "Silicon Valley"
					},
					substitution_data: {
						customer_type: "Platinum"
					}
				}
			],
			content: {
				from: {
					name: "Square Mail",
					email: "squaremail@mail.pxlbin.com"
				},
				subject: req.body.subject,
				reply_to: "Square Mail <squaremail@mail.pxlbin.com>",
				headers: {
					"X-Customer-Campaign-ID": "squaremail_campaign"
				},
				template_id: 'my-template'
			}
		}
	};
  client.transmissions.send(reqOpts, function(err, response) {
    if (err) {
      console.log(err);
    } else {
      console.log(response.body);
      console.log("Congrats you can use our SDK!");
    }
  });
  var search_req = new cps.SearchRequest("*", 0, 100);
  cpsConn.sendRequest(search_req, function (err, search_resp) {
      if (err) return console.log(err);
      console.log(search_resp.results.document);
      res.render('index.ejs', {'emails': search_resp.results.document});
  });
});

//Run server
http.listen(port, function() {
  console.log('listening on *:5000');
});