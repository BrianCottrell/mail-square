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
var storeEmail = function(data){
    var id = Date.now(),
        content = data;
    var insert_request = new cps.InsertRequest('<document><id>'+id+'</id>'+cps.Term(content, "content")+'</document>');
    cpsConn.sendRequest(insert_request, function(err, insert_response) {
        if (err) return console.error(err);
       console.log('New email added: ' + insert_response.document[0].id);
    });
}

app.get('/',function(req,res){
    var search_req = new cps.SearchRequest("*", 0, 100);
    cpsConn.sendRequest(search_req, function (err, search_resp) {
        if (err) return console.log(err);
        console.log(search_resp.results.document);
        res.render('index.ejs', {'emails': search_resp.results.document});
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
    }));
    console.log(req.body['Text-part']);
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
			campaign_id: "squaremail_campaign",
			return_path: "squaremail@mail.pxlbin.com",
			metadata: {
				user_type: "students"
			},
			substitution_data: {
				sender: "Big Store Team"
			},
			recipients: [
				{
					return_path: "squaremail@mail.pxlbin.com",
					address: {
						email: "tanmaypa@usc.edu",
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
				subject: "Welcome from Sqaure Mail",
				reply_to: "Christmas Sales <squaremail@mail.pxlbin.com>",
				headers: {
					"X-Customer-Campaign-ID": "squaremail_campaign"
				},
				text: "Hi {{address.name}} \nThis is a mail from location {{place}}!",
				html: "<p>Hi {{address.name}} \nThis is a mail from location {{place}}!! \n</p>"
			}
		}
	};

    client.transmissions.send(reqOpts, function(err, res) {
      if (err) {
        console.log(err);
      } else {
        console.log(res.body);
        console.log("Congrats you can use our SDK!");
        res.render('index');
      }
    });
});

//Run server
http.listen(port, function() {
  console.log('listening on *:5000');
});