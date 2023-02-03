import fs from 'fs';

import jsdom from 'jsdom';

const { JSDOM } = jsdom;

class Link {

    #href;

    #downloaded;

    constructor ( href ) {
        Object.freeze ( this );
        this.#href = href;
        this.#downloaded = false;
    }

    get href ( ) { return this.#href; }

    get downloaded ( ) { return this.#downloaded; }
    set downloaded ( downloaded ) { 
        if ( downloaded && ! this.#downloaded ){
            this.#downloaded = true;
        } 
    }
}

class SiteDownloader {

    #linkMap;

    #site = 'http://razara.anthisnes.org/';
    #destDir = 'dest/';
    #destSite = 'http://razara.anthisnes.org/'

    #processLink ( href ){
        if ( 0 === href.indexOf( this.#site ) ) {
            if ( ! this.#linkMap.get ( href ) ) {
                this.#linkMap.set ( href,  new Link ( href ) );
            }
         }
    }

    #processResponse ( responseText ) {
        const dom = new JSDOM ( responseText );
        let document = dom.window.document;
        document.querySelectorAll('a').forEach(
            link => { this.#processLink ( link.href ); }
        );       
    }

    constructor ( ) {
        Object.freeze ( this );
        this.#linkMap = new Map ( );
    }

    #getNextPage ( ) {

/*        const iteratorLink = this.#linkMap.entries();
        let link =  iteratorLink.next().value [ 1 ];
        while ( link && link.downloaded ) {
            link =  iteratorLink.next().value [ 1 ];
            if ( ! link.downloaded ) {
                return link.href;
            }
        }

        return null;
*/
        const iterator1 = this.#linkMap [ Symbol.iterator ]( );

        for (const item of iterator1) {
            if ( !item [ 1 ].downloaded  ) {
                return item [1].href;
            }
        }
        return null;
    }

    async start ( ) { 

        await this.#download ( this.#site );

        let nextPage = this.#getNextPage ( )
        while ( nextPage ) {
            await this.#download ( nextPage );
            nextPage = this.#getNextPage ( );
        }
    }

    #createPath ( link ) {
        const filePath = link.replaceAll ( this.#site, this.#destDir );
        const dirs = filePath.split ( '/');
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

    #saveToFile ( link, text ) {
        const filePath = this.#createPath ( link );
        const fileContent = text.replaceAll ( this.#site, this.#destSite );
        fs.writeFileSync ( filePath + '/index.html', fileContent );
        this.#linkMap.get ( link ).downloaded = true;
    }

    async #download ( link ) {
        console.log ( 'Now downloading ' + link );
        await fetch ( link )
            .then (
                response => response.text() 
            )
            .then (
                text => {
                    this.#processResponse ( text ); 
                    this.#saveToFile ( link, text );
                }
            );     
    }
}

const theSiteDownloader = new SiteDownloader;

theSiteDownloader.start ( );