/*
Copyright - 2017 2021 - wwwouaiebe - Contact: https://www.ouaie.be/

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

module.exports = function ( grunt ) {

	grunt.initConfig ( {
		pkg : grunt.file.readJSON ( 'package.json' ),

		// eslint config

		eslint : {
			options : {
				fix : true,
				overrideConfigFile : '.eslintrc.json'
			},
			target : [ 'src/*.js' ]
		},

		buildnumber : {
			options : {
				file : 'buildNumber.json'
			},
			start : {
				action : 'read',
				values : [
					{
						name : 'build',
						initialValue : 0,
						transform : value => String ( value ).padStart ( 5, '0' )
					}
				]
			},
			end : {
				action : 'write',
				values : [
					{
						name : 'build',
						initialValue : 0,
						transform : value => value + 1
					}
				]
			}
		}
	} );

	// Build number

	// grunt.config.data.pkg.buildNumber = grunt.file.readJSON ( 'buildNumber.json' ).buildNumber;
	// grunt.config.data.pkg.buildNumber = ( '00000' + ( Number.parseInt ( grunt.config.data.pkg.buildNumber ) + 1 ) ).substr ( -5, 5 );
	// grunt.file.write ( 'buildNumber.json', '{ "buildNumber" : "' + grunt.config.data.pkg.buildNumber + '"}' );

	grunt.loadNpmTasks ( 'grunt-eslint' );
	grunt.loadNpmTasks ( 'grunt-wwwouaiebe-buildnumber' );

	grunt.registerTask (
		'hello',
		'hello',
		function () {
			console.error (
				'\x1b[30;101m Start build of ' +
				grunt.config.data.pkg.name + ' - ' +
				grunt.config.data.pkg.version + ' - ' +
				grunt.template.today ( 'isoDateTime' )
				+ ' \x1b[0m'
			);
		}
	);

	grunt.registerTask (
		'bye',
		'bye',
		function () {
			console.error (
				'\x1b[30;42m ' +
				grunt.config.data.pkg.name + ' - ' +
				grunt.config.data.pkg.version + ' - build: ' +
				grunt.config.data.build + ' - ' +
				grunt.template.today ( 'isoDateTime' ) +
				' done \x1b[0m'
			);
		}
	);

	grunt.registerTask (
		'default',
		[
			'hello',
			'buildnumber:start',
			'eslint',
			'buildnumber:end',
			'bye'
		]
	);

	console.log ( '---------------------------------------------------------------------------------------------------------------------------------------------' );
	console.log ( '\n                                     ' + grunt.config.data.pkg.name + ' - ' + grunt.config.data.pkg.version + ' - build: ' + grunt.config.data.pkg.buildNumber + ' - ' + grunt.template.today ( 'isoDateTime' ) + '\n' );
	console.log ( '---------------------------------------------------------------------------------------------------------------------------------------------' );
};