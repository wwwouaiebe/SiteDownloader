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
import theConfig from './Config.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
The htaccess files builder
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

class HtAccessBuilder {

	/**
	 * The folder where the .htaccess are stored
	 * @type {String}
	 */

	#htAccessPath = '';

	/**
	 * Build the .htaccess files
	 */

	build ( ) {
		const fileNames = fs.readdirSync ( theConfig.destDir );
		fileNames.forEach (
			fileName => {
				const lstat = fs.lstatSync ( theConfig.destDir + '/' + fileName );
				if ( lstat.isDirectory ( ) ) {
					const htAccessSrc = 'public' === fileName ? 'public.htaccess' : 'subdirectory.htaccess';
					if (
						fs.existsSync ( this.#htAccessPath + htAccessSrc )
						&&
						-1 === [ 'p401', 'p403', 'p404' ].indexOf ( fileName )
					) {
						fs.copyFileSync (
							this.#htAccessPath + htAccessSrc,
							theConfig.destDir + '/' + fileName + '/.htaccess'
						);
					}
				}
			}
		);
		if ( fs.existsSync ( this.#htAccessPath + 'root.htaccess' ) ) {
			fs.copyFileSync (
				this.#htAccessPath + 'root.htaccess',
				theConfig.destDir + '/.htaccess'
			);
		}
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
		this.#htAccessPath = './htaccess/' + theConfig.site + '/';
	}

}

export default HtAccessBuilder;

/* --- End of file --------------------------------------------------------------------------------------------------------- */