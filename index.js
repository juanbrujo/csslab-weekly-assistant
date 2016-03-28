var async		= require('async');
var url			= require('url');
var path		= require('path');
var pkg			= require(path.join(__dirname, './package.json'));
var fs			= require('fs');
var inquirer	= require('inquirer');
var program		= require('commander');
var request		= require('request');
var cheerio		= require('cheerio');
var webshot		= require('webshot');
var sluggin		= require('Sluggin').Sluggin;
var sites		= require('./20160324/sites.js');

program
	.version( pkg.version )
	.parse( process.argv );


function listDirectory(path){
	return fs.readdirSync( path ).filter( function (file) {
    return fs.statSync( path + '/' + file ).isDirectory();
  });
}
// console.log( listDirectory('./') );


/**
 * cleanName( uri );
 * @uri: string | uri
 * return string
 */
var cleanName = function( uri ){
	return sluggin( url.parse(uri).href.replace('www.','').split('//')[1] );
}


/**
 * getScreenshot( sitename );
 * @sitename: string | clean name of site
 * @callback: function | callback
 * return callback
 *
 * get and save a screenshot of each site
 *
 */
function getScreenshot( sitename, callback ){

	var webshotOptions = {
		encoding: 'binary',
		renderDelay: 1000
	};

	webshot(sitename, './20160324/' + cleanName( sitename ) + '.png', webshotOptions, function(err) {
		if (err) return callback(err);
		callback(null, '📸  · ' + sitename + ' screenshot OK!');
	});

}


/**
 * getContent( sitename );
 * @sitename: string | clean name of site
 * @callback: function | callback
 * return callback
 *
 * scrape title & description for each site
 *
 */
function getContent( sitename, callback ){

	var title = '';
	var description = '';

	request(sitename, function(error, response, html) {

		if (error || response.statusCode !== 200) return callback(error || new Error('Not found'));

		var $ = cheerio.load(html);

		title = $("title").text();
		description = $('meta[name="description"]').attr('content');

		callback(null, title + ' | ' +  description, sitename);

	});

}


/**
 * writeToFile( @params );
 * @content: string | content scraped
 * @sitename: string | clean name of site
 * @callback: function | callback
 * return callback
 *
 * saves content to file for each site
 *
 */
function writeToFile( content, sitename, cb ) {

	fs.writeFile('./20160324/' + cleanName( sitename ) + '.md', content, function(err) {

		if (err) return cb(err);
		cb(null, '📂 · The file ' + cleanName( sitename ) + '.md was created!');

	});

}

/**
 * getContentAndWriteToFile( @params );
 *
 * @uri: string | uri
 * @callback: function | callback
 * return callback
 *
 */
function getContentAndWriteToFile( uri, callback ) {

	async.waterfall([

		async.apply(getContent, uri),
		writeToFile

	], callback);

}

/**
 * parseUrl( @params );
 *
 * @uri: string | uri
 * @callback: function | callback
 * return callback
 *
 */
function parseUrl(uri, callback) {

	async.parallel([

		// take screenshot
		async.apply(getScreenshot, uri),
		// get content & save to file
		async.apply(getContentAndWriteToFile, uri)

	], callback);

}

/**
 * parseSites( @params );
 *
 * @sites: array | of site url's
 * @callback: function | callback
 * return callback
 *
 */
function parseSites(sites, callback) {

	async.map(sites, parseUrl, callback);

}


/**
 * APPLY

parseSites(sites, function(err, results){

	if (err) return console.error(err);

	results.forEach(function(result) {
		result.forEach(function(log) {
			console.log(log);
		});
	});

	console.log('Everything OK');

});
 */
