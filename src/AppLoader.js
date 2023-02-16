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
import process from 'process';

import theConfig from './Config.js';
import SourceDownloader from './SourceDownloader.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
Start the app:
- read and validate the arguments
- set the config
- remove the old files if any
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

class AppLoader {

	/**
	A const to use when exit the app due to a bad parameter
	@type {Number}
	*/

	// eslint-disable-next-line no-magic-numbers
	static get #EXIT_BAD_PARAMETER ( ) { return 9; }

	/**
	The version number
	@type {String}
	*/

	static get #version ( ) { return 'v1.0.0'; }

	/**
	Show the help on the screen
	*/

	#showHelp ( ) {
		console.error ( '\n\t\x1b[36m--help\x1b[0m : this help\n' );
		console.error ( '\t\x1b[36m--version\x1b[0m : the version number\n' );
		console.error ( '\t\x1b[36m--srcUrl\x1b[0m : The url where the source files are\n' );
		console.error ( '\t\x1b[36m--destUrl\x1b[0m : The url where the files have to go\n' );
		console.error (
			'\t\x1b[36m--destDir\x1b[0m : the path to the directory where' +
			' the files have to be generated\n'
		);
		process.exit ( 0 );
	}

	/**
	Validate a path:
	- Verify that the path exists on the computer
	- verify that the path is a directory
	- complete the path with a \
	@param {String} path The path to validate
	*/

	#validatePath ( path ) {
		let returnPath = path;
		if ( '' === returnPath ) {
			console.error ( 'Invalid or missing \x1b[31m--src or dest\x1b[0m parameter' );
			process.exit ( AppLoader.#EXIT_BAD_PARAMETER );
		}
		let pathSeparator = null;
		try {
			returnPath = fs.realpathSync ( path );

			// path.sep seems not working...
			pathSeparator = -1 === returnPath.indexOf ( '\\' ) ? '/' : '\\';
			const lstat = fs.lstatSync ( returnPath );
			if ( lstat.isFile ( ) ) {
				returnPath = returnPath.substring ( 0, returnPath.lastIndexOf ( pathSeparator ) );
			}
		}
		catch {
			console.error ( 'Invalid path for the --src or --dest parameter \x1b[31m%s\x1b[0m', returnPath );
			process.exit ( AppLoader.#EXIT_BAD_PARAMETER );
		}
		returnPath += pathSeparator;
		return returnPath;
	}

	/**
	Complete theConfig object from the app parameters
	@param {?Object} options The options for the app
	*/

	#createConfig ( options ) {

		if ( options ) {
			theConfig.srcUrl = options.srcUrl;
			theConfig.destUrl = options.destUrl;
			theConfig.destDir = options.destDir;
			theConfig.appDir = process.cwd ( ) + '/node_modules/sitedownloader/src';
		}
		else {
			process.argv.forEach (
				arg => {
					const argContent = arg.split ( '=' );
					switch ( argContent [ 0 ] ) {
					case '--srcUrl' :
						theConfig.srcUrl = argContent [ 1 ] || theConfig.srcUrl;
						break;
					case '--destUrl' :
						theConfig.destUrl = argContent [ 1 ] || theConfig.destUrl;
						break;
					case '--destDir' :
						theConfig.destDir = argContent [ 1 ] || theConfig.destDir;
						break;
					case '--help' :
						this.#showHelp ( );
						break;
					case '--version' :
						console.error ( `\n\t\x1b[36mVersion : ${AppLoader.#version}\x1b[0m\n` );
						process.exit ( 0 );
						break;
					default :
						break;
					}
				}
			);
			theConfig.appDir = process.argv [ 1 ];
		}

		if ( 'https' !== theConfig.srcUrl.substring ( 0, 5 ) ) {
			console.error ( `\n\t\x1b[36msrcUrl ${theConfig.srcUrl} must be https\x1b[0m\n` );
			process.exit ( 1 );
		}

		if ( 'https' !== theConfig.destUrl.substring ( 0, 5 ) ) {
			console.error ( `\n\t\x1b[36mdestUrl ${theConfig.destUrl} must be https\x1b[0m\n` );
			process.exit ( 1 );
		}

		theConfig.destDir = this.#validatePath ( theConfig.destDir );

		// the config is now frozen
		Object.freeze ( theConfig );
	}

	/**
	Clean the previously created files, to avoid deprecated files in the documentation.
	*/

	#cleanOldFiles ( ) {
		try {

			// Removing the complete documentation directory
			fs.rmSync (
				theConfig.destDir,
				{ recursive : true, force : true },
				err => {
					if ( err ) {
						throw err;
					}
				}
			);

			// and then recreating
			fs.mkdirSync ( theConfig.destDir );
		}
		catch {

			// Sometime the cleaning fails due to opened files
			console.error ( `\x1b[31mNot possible to clean the ${theConfig.destDir} folder\x1b[0m` );
		}
	}

	/**
	The constructor
	*/

	constructor ( ) {
		Object.freeze ( this );
	}

	/**
	Load the app, searching all the needed infos to run the app correctly
	@param {?Object} options The options for the app
	*/

	async loadApp ( options ) {

		const sourceDownloader = new SourceDownloader ( );
		await sourceDownloader.askCredentials ( );

		// start time
		const startTime = process.hrtime.bigint ( );

		// console.clear ( );
		console.info ( `\nStarting SiteDownloader ${AppLoader.#version}...` );

		// config
		this.#createConfig ( options );

		this.#cleanOldFiles ( );

		await sourceDownloader.start ( );

		// end of the process
		const deltaTime = process.hrtime.bigint ( ) - startTime;

		/* eslint-disable-next-line no-magic-numbers */
		const execTime = String ( deltaTime / 1000000000n ) + '.' + String ( deltaTime % 1000000000n ).substring ( 0, 3 );
		console.error ( `\nFiles generated in ${execTime} seconds in the folder \x1b[36m${theConfig.destDir}\x1b[0m` );

	}
}

export default AppLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */