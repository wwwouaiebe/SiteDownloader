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

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
Simple container for a link
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

class Link {

	/**
    The href for the link
    @type {String}
    */

	#href;

	/**
    A flag set to true when the link is downloaded
    @type {boolean}
    */

	#downloaded;

	/**
    The constructor
	@param {String} href The href for the link
    */

	constructor ( href ) {
		Object.freeze ( this );
		this.#href = href;
		this.#downloaded = false;
	}

	/**
    The href for the link
    @type {String}
    */

	get href ( ) { return this.#href; }

	/**
    A flag set to true when the link is downloaded. Can never be set to false
    @type {boolean}
    */

	get downloaded ( ) { return this.#downloaded; }

	set downloaded ( downloaded ) {
		if ( downloaded && ! this.#downloaded ) {
			this.#downloaded = true;
		}
	}
}

export default Link;

/* --- End of file --------------------------------------------------------------------------------------------------------- */