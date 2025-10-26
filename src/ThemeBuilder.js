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
The themes files builder
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

class ThemeBuilder {

	/**
     * Build the razara theme
     */

	#buildRazaraTheme ( ) {
		fs.cpSync (
			theConfig.srcDir + '/themes/RAZARA4' + theConfig.site + '/scripts',
			theConfig.destDir + '/themes/RAZARA4' + theConfig.site + '/scripts',
			{ recursive : true }
		);
		fs.cpSync (
			theConfig.srcDir + '/themes/RAZARA4' + theConfig.site + '/styles',
			theConfig.destDir + '/themes/RAZARA4' + theConfig.site + '/styles',
			{ recursive : true }
		);
		fs.cpSync (
			theConfig.srcDir + '/themes/RAZARA4' + theConfig.site + '/pictures',
			theConfig.destDir + '/themes/RAZARA4' + theConfig.site + '/pictures',
			{ recursive : true }
		);
	}

	/**
     * Build themes for aiolibre
    */

	#buildAiolibreTheme ( ) {
		fs.cpSync ( theConfig.srcDir + '/themes', theConfig.destDir + '/themes', { recursive : true } );
	}

	/**
     * Build themes
     */

	build ( ) {
		switch ( theConfig.site ) {
		case 'aiolibre' :
			this.#buildAiolibreTheme ( );
			break;
		case 'anthisnes' :
		case 'ouaie' :
			this.#buildRazaraTheme ( );
			break;
		default :
			break;
		}
	}

	/**
     * The constructor
     */

	constructor ( ) {

	}
}

export default ThemeBuilder;

/* --- End of file --------------------------------------------------------------------------------------------------------- */