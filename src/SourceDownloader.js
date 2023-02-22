/*
Copyright - 2021 - wwwouaiebe - Contact: https://www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
Changes:
	- v1.0.0:
		- created
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import fs from 'fs';
import jsdom from 'jsdom';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Buffer } from 'buffer';
import process from 'process';

import theConfig from './Config.js';
import Link from './Link.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
Do the download of all the html files from a site and save it to a local file:
- download the main page of the site
- search the links on the page
- do the same recursively on all the found links to the same url
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

class SourceDownloader {

	/**
    A JS map with all the links found in the downloaded site
    @type {Map}
    */

	#linkMap;

	/**
    A counter for the downloaded files
    @type {Number}
    */

	#fileCounter;

	/**
	A list of keywords to exclude some url
	@type {Array.<String>}
	*/

	#excludeList = [ 'TravelNotes', 'EncryptDecrypt', 'base64' ];

	/**
	The credentials used for the site
	@type {String}
	*/

	#credentials;

	/**
	The file content after mofdification of the links
	@type {String}
	*/

	#fileContent;

	/**
    Add an url to the link map if needed
    @param {HTMLElement} anchorHTMLElement the anchor html element with the link
    */

	#processLink ( anchorHTMLElement ) {

		// decoding the url ( = replace %... with the correct characters )
		let decodedUrl = decodeURI ( anchorHTMLElement.href );
		let exclude = false;

		// excluding some url
		this.#excludeList.forEach (
			keyword => { exclude = decodedUrl.includes ( keyword ) || exclude; }
		);
		if ( exclude ) {
			return;
		}

		// replacing relative url with absolute url

		if ( 0 === decodedUrl.indexOf ( '/' ) ) {
			decodedUrl = theConfig.srcUrl + decodedUrl.slice ( 1 );
		}

		// removing anchor from the url
		let sqrIndex = decodedUrl.indexOf ( '#' );
		if ( -1 !== sqrIndex ) {
			decodedUrl = decodedUrl.slice ( 0, sqrIndex );
		}

		// it's a link to an image...
		if ( -1 !== decodedUrl.indexOf ( '.jpg' ) ) {
			return;
		}

		// we verify that the url point to the downloaded site
		if ( 0 !== decodedUrl.indexOf ( theConfig.srcUrl ) ) {
			return;
		}

		// adding a / at the end of the href to avoid a http 301 error on the server
		if ( '/' !== decodedUrl.slice ( -1 ) ) {
			anchorHTMLElement.href += '/';
		}

		// we add the url to the link map if not already done
		if ( ! this.#linkMap.get ( decodedUrl ) ) {
			this.#linkMap.set ( decodedUrl, new Link ( decodedUrl ) );
		}
	}

	/**
    extract the links from the file content and save it to the link map
    @param {String} fileContent The file content
    */

	#extractLinks ( fileContent ) {

		const { JSDOM } = jsdom;

		// parsing the file as dom document
		const dom = new JSDOM ( fileContent );

		// searching and process all AnchorHTMLElement from the dom document
		dom.window.document.querySelectorAll ( 'a' ).forEach (
			anchorHTMLElement => {
				if ( anchorHTMLElement.href ) {
					this.#processLink ( anchorHTMLElement );
				}
			}
		);

		this.#fileContent = dom.serialize ( );
	}

	/**
    The constructor
    */

	constructor ( ) {
		Object.freeze ( this );
		this.#linkMap = new Map ( );
	}

	/**
    Search the first not downloaded url
    */

	#getNextUrl ( ) {

		// iteration on the link map
		const iterator1 = this.#linkMap [ Symbol.iterator ] ( );
		for ( const item of iterator1 ) {
			if ( ! item [ 1 ].downloaded ) {

				// found a not downloaded link
				return item [ 1 ].href;
			}
		}

		// nothing found so returning null
		return null;
	}

	/**
    Ask the user name and pswd
    */

	async askCredentials ( ) {
		console.clear ( );

		const readlineInterface = readline.createInterface ( { input, output } );

		readlineInterface.write ( 'What is your name?\n' );
		const userName = await readlineInterface.question ( '' );
		readlineInterface.write ( 'What is your pswd?\n' );
		const userPswd = await readlineInterface.question ( '\x1b[8;40m' );
		readlineInterface.close ( );

		console.clear ( );

		this.#credentials =
			'Basic ' +
			Buffer.from ( userName + ':' + userPswd ).toString ( 'base64' );

		console.info ( '\x1b[0m' );
	}

	/**
	Start the download
	*/

	async start ( ) {
		this.#fileCounter = 0;

		this.#linkMap.set ( theConfig.srcUrl + 'erreur/401', new Link ( theConfig.srcUrl + 'erreur/401' ) );
		this.#linkMap.set ( theConfig.srcUrl + 'erreur/403', new Link ( theConfig.srcUrl + 'erreur/403' ) );
		this.#linkMap.set ( theConfig.srcUrl + 'erreur/404', new Link ( theConfig.srcUrl + 'erreur/404' ) );

		// downloading the main page
		await this.#download ( theConfig.srcUrl );

		// loop on the others url
		let nextUrl = this.#getNextUrl ( );
		while ( nextUrl ) {
			await this.#download ( nextUrl );
			nextUrl = this.#getNextUrl ( );
		}
		console.info ( `\n${this.#fileCounter} files generated.` );
	}

	/**
	Create the paths in the dest folder
	@param {String} srcUrl the source url
	*/

	#createPath ( srcUrl ) {
		const filePath = srcUrl.replaceAll ( theConfig.srcUrl, theConfig.destDir );
		const dirs = filePath.split ( '/' );
		let currentDir = '';
		dirs.forEach (
			dir => {
				currentDir += dir + '/';
				try {
					if ( ! fs.existsSync ( currentDir ) ) {
						fs.mkdirSync ( currentDir );
					}
				}
				catch ( err ) {
					console.error ( err );
				}
			}
		);

		return filePath;
	}

	/**
    Adapt the url in the file content, save the file content to a file and adapt the link map
    @param {String} srcUrl the url of the downloaded file
    */

	#saveToFile ( srcUrl ) {

		// Creating the path for the file
		const filePath = this.#createPath ( srcUrl );

		// replacing url in the file content and saving the file
		fs.writeFileSync (
			filePath + '/index.html',
			this.#fileContent.replaceAll ( theConfig.srcUrl, theConfig.destUrl )
		);

		// adapting the link map
		this.#linkMap.get ( srcUrl ).downloaded = true;
	}

	/**
    Download a file from an url, save the file and add the links found in the file to the link map
    @param {String} downloadedUrl
    */

	async #download ( downloadedUrl ) {
		this.#fileCounter ++;
		console.info ( 'Now downloading ' + downloadedUrl );
		let headers = new Headers ( );
		headers.append ( 'Authorization', this.#credentials );

		await fetch ( downloadedUrl, { headers : headers } )
			.then (
				response => {
					if ( response.ok ) {
						return response.text ();
					}
					console.error ( String ( response.status ) + ' ' + response.statusText );
					process.exit ( 1 );
				}
			)
			.then (
				fileContent => {
					this.#extractLinks ( fileContent );
					this.#saveToFile ( downloadedUrl );
				}
			)
			.catch (
				err => {
					console.error ( err );
					process.exit ( 1 );
				}
			);
	}
}

export default SourceDownloader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */