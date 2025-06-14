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
import sharp from 'sharp';

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

	#excludeList = [ 'TravelNotes', 'EncryptDecrypt', 'base64', '.jpeg' ];

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
		this.#credentials = '';
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
    convert recursively jpg files to WebP files and copy others files
	@param {String} srcDir the src directory
	@param {String} destDir the destination directory
    */

	async #convertJpgs ( srcDir, destDir ) {

		// Searching all files and directories present in the directory
		const fileNames = fs.readdirSync ( srcDir );

		let fileCounter = 0;
		for ( fileCounter = 0; fileCounter < fileNames.length; fileCounter ++ ) {
			let fileName = fileNames [ fileCounter ];

			// Searching the stat of the file/directory
			const lstat = fs.lstatSync ( srcDir + fileName );
			if ( lstat.isDirectory ( ) ) {

				// It's a directory. Reading this recursively
				fs.mkdirSync ( destDir + fileName + '/' );
				await this.#convertJpgs ( srcDir + fileName + '/', destDir + fileName + '/' );
			}
			if ( lstat.isFile ( ) ) {
				if ( 'jpg' === fileName.split ( '.' ).reverse ( )[ 0 ] ) {
					await sharp ( srcDir + fileName )
						.keepIccProfile ( )
						.withExif (
							{
								IFD0 : {
									Copyright : 'wwwouaiebe contact https://www.ouaie.be/',
									Artist : 'wwwouaiebe contact https://www.ouaie.be/'
								}
							}
						)
						.toFile ( destDir + fileName.split ( '.' )[ 0 ] + '.WebP' );
				}
				else {
					fs.copyFileSync ( srcDir + fileName, destDir + fileName );
				}
			}
		}
	}

	/**
	Start the download
	*/

	async start ( ) {

		// Preparing the public folder
		fs.mkdirSync ( theConfig.destDir + '/public/' );
		await this.#convertJpgs ( theConfig.srcDir + '/public/', theConfig.destDir + '/public/' );

		// Copying themes
		fs.cpSync ( theConfig.srcDir + '/themes', theConfig.destDir + '/themes', { recursive : true } );

		// http errors
		console.log ( theConfig.srcDir );
		if ( 'C:\\wamp64\\www\\aiolibre\\' !== theConfig.srcDir ) {
			this.#linkMap.set ( theConfig.srcUrl + 'p401/erreur/', new Link ( theConfig.srcUrl + 'p401/erreur/' ) );
			this.#linkMap.set ( theConfig.srcUrl + 'p403/erreur/', new Link ( theConfig.srcUrl + 'p403/erreur/' ) );
			this.#linkMap.set ( theConfig.srcUrl + 'p404/erreur/', new Link ( theConfig.srcUrl + 'p404/erreur/' ) );
		}

		this.#fileCounter = 0;

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

		// replacing url and jpg with WebP in the file content
		this.#fileContent = this.#fileContent.replaceAll ( 'jpg', 'WebP' ).replaceAll ( theConfig.srcUrl, theConfig.destUrl );

		// saving the file
		fs.writeFileSync (
			filePath + '/index.html',
			this.#fileContent
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

		if ( '' !== this.#credentials ) {
			headers.append ( 'Authorization', this.#credentials );
		}

		await fetch ( downloadedUrl, { headers : headers } )
			.then (
				response => {
					if ( response.ok ) {
						return response.text ( );
					}
					// eslint-disable-next-line no-magic-numbers
					else if ( 401 === response.status && downloadedUrl.includes ( 'p401/erreur' ) ) {
						return response.text ( );
					}
					// eslint-disable-next-line no-magic-numbers
					else if ( 410 === response.status && downloadedUrl.includes ( 'p403/erreur' ) ) {
						return response.text ( );
					}
					// eslint-disable-next-line no-magic-numbers
					else if ( 404 === response.status && downloadedUrl.includes ( 'p404/erreur' ) ) {
						return response.text ( );
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