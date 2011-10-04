/*
Simple text-to-PNG code
Written in 2011 by anonymous author
To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
*/

// Convert text into a canvas element that we can then extract as a .png image, which includes compression, and automagically base64 it. 

/* anonymous closure to keep internals out of the global namespace*/
(function(window, undefined) {
	var CANVAS_COMPRESS = window.CANVAS_COMPRESS = {}, // setup an internal link to the global object we are building
	HEADER = 'data:image/png;base64,';

	function MakeSafe (s) { // Keys, and also types, cannot have newlines or tabs. Although tabs don't _hurt_ values, easier to replace them.
		s+=''; // make it a string
		// encodeURIComponent misses these since they are 'valid' in uris
		// !    %21
		// '	%27
		// (	%28
		// )	%29
		// *	%30
		// -	%2D
		// _	%5F
		// ~	%7E
		// .    %2E
		return encodeURIComponent(s).replace(/!/g,'%21').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/\*/g,'%30').replace(/-/g,'%2D').replace(/_/g,'%5F').replace(/~/g,'%7E').replace(/\./g,'%2E').replace(/'/g,'%27'); // ')// Fix syntax highlight
	}
	
	function UnMakeSafe (s) {
		s+=''; // make it a string
		return decodeURIComponent(s);
	}

	function CompressCharTo6BitNum(c) {
		if (typeof c !== 'string' || c.length === 0) {
			return 0; // yes, this is 'a', I know, but it'll get fixed.
		}
		// Allowed characters: 0-9, a-z, A-Z, %, .
		// Assume we have ensured that already.
		// output order os a-z, A-Z, 0-9, %, .

		var n = c.charCodeAt(0);

		if (n >= 97 && n <= 122) { // a-z
			return n-97; // 0 to 25
		}
		if (n >= 65 && n <= 90) { // A-Z
			return n-39; // 26 to 51
		}
		if (n >= 48 && n <= 57) { // 0-9
			return n+4; // 52-61
		}
		if (n === 37) { // %
			return 62;
		}
		if (n === 9) { // \t
			return 63;
		}
		return 0;
	//console.error('Cannot compress ' +c);
	}

	function Inflate6BitNumToChar(n) {
		if (n <= 25) { // a-z
			return String.fromCharCode(n + 97);
		}
		if (n <= 51) { // A-Z
			return String.fromCharCode(n + 39);
		}
		if (n <= 61) { // 0-9
			return String.fromCharCode(n - 4);
		}
		if (n === 62) {
			return '%';
		}
		if (n === 63) {
			return '\t';
		}
		return '';
	}

	function FourCharsToRGB(c1, c2, c3, c4) {
		c1 = CompressCharTo6BitNum(c1);
		c2 = CompressCharTo6BitNum(c2);
		c3 = CompressCharTo6BitNum(c3);
		c4 = CompressCharTo6BitNum(c4);
		// 11111122 22223333 33444444
		var r=(c1<<2)|((c2&0x30)>>4);
		var g=((c2&0x0F)<<4)|((c3&0x3C)>>2);
		var b=((c3&0x03)<<6)|c4;
		return 'rgb('+r+','+g+','+b+')';
	}
	
	function FourCharsToRGBArray(c1, c2, c3, c4) {
		c1 = CompressCharTo6BitNum(c1);
		c2 = CompressCharTo6BitNum(c2);
		c3 = CompressCharTo6BitNum(c3);
		c4 = CompressCharTo6BitNum(c4);
		// 11111122 22223333 33444444
		var r=(c1<<2)|((c2&0x30)>>4);
		var g=((c2&0x0F)<<4)|((c3&0x3C)>>2);
		var b=((c3&0x03)<<6)|c4;
		//console.log(r,g,b);
		return [r,g,b,255];
	}
	
	function RGBToFourCharString(r, g, b) {
		// 11111122 22223333 33444444
		var c1=(r&0xFC)>>2;
		var c2=((r&0x03)<<4)|((g&0xF0)>>4);
		var c3=((g&0x0F)<<2)|((b&0xC0)>>6);
		var c4 = b&0x3F;
		return Inflate6BitNumToChar(c1) + Inflate6BitNumToChar(c2) + Inflate6BitNumToChar(c3) + Inflate6BitNumToChar(c4);
	}

	CANVAS_COMPRESS.EncodeString = function(s) {
		var c = document.createElement('canvas'),
		height, width,
		ctx, img,
		imdata,
		i, d,
		ret;

		s = MakeSafe(s);
		width = Math.floor(Math.pow(s.length/4,0.5));
		if (width < 3) {
			width = 3;
		}
		height = Math.ceil((s.length/4)/width);
		if (height < 1) {
			height = 1;
		}
		while(height*width-2 < s.length/4) {
			height++;
		}

		c.width = width;
		c.height = height; // this must go before getContext!
		ctx = c.getContext('2d');
		ctx.globalCompositeOperation = "source-over";

		imdata = ctx.createImageData(width,height);
		imdata.data[0] = (s.length&0xFF0000000000)>>40;
		imdata.data[1] = (s.length&0x00FF00000000)>>32;
		imdata.data[2] = (s.length&0x0000FF000000)>>24;
		imdata.data[3] = 255;

		imdata.data[4] = (s.length&0x000000FF0000)>>16;
		imdata.data[5] = (s.length&0x00000000FF00)>>8;
		imdata.data[6] = s.length&0x0000000000FF;
		imdata.data[7] = 255;

		// Save the length into the first 2 pixels, hence col starting at 2;
		// Using 2 pixels allows for ASCII files up to 256 TiB. With a T.

		for (i = 0; i < s.length; i += 4) {
			ret = FourCharsToRGBArray(s.charAt(i),s.charAt(i+1),s.charAt(i+2),s.charAt(i+3));
			imdata.data[i+8]=ret[0];
			imdata.data[i+9]=ret[1];
			imdata.data[i+10]=ret[2];
			imdata.data[i+11]=ret[3];
		}

		ctx.putImageData(imdata,0,0);

		d = c.toDataURL("image/png");
		if (document.getElementById('saveimages')){
			img = document.createElement('img');
			img.src = d;
			document.getElementById('saveimages').appendChild(img);
		}
		return d.substring(HEADER.length); // remove the 'header'
	};
	
	CANVAS_COMPRESS.DecodeImage = function(i, f) {
		var img = document.createElement('img'),
		c;
		img.src = HEADER+i;
		if (document.getElementById('loadimages')) {
			document.getElementById('loadimages').appendChild(img);
		}
		c = document.createElement('canvas');
		img.onload = function(){

			var h = img.height,
			w = img.width,
			ctx = c.getContext('2d'),
			ptx, len,
			s = '',
			j;

			c.width = w;
			c.height = h;
			ctx.globalCompositeOperation = "source-over";
			ctx.drawImage(img,0,0);
			px = ctx.getImageData(0,0,w,h);
			// first 2 pixels contain the length, sufficient to deal with up to 256 TiB ASCII files
			len=(px.data[0]<<40)+(px.data[1]<<32)+(px.data[2]<<24)+(px.data[4]<<16)+(px.data[5]<<8)+(px.data[6])+8;

			// note: add 8 to skip these properly :)
			// note 2: 3 and 7 are both alphas.

			// start at 8
			for(j = 8;j<=len;j+=4) // have to skip the alpha
			{
				s+=RGBToFourCharString(px.data[j],px.data[j+1],px.data[j+2]);
			}
			if (f) {
				f(UnMakeSafe(s.replace(/%0Aa*$/,'%0A'))); // the save file must end with a newline and then a's (which are nulls). Remove them
			}

		};

	};

}(this));
// explicitly omit the 2nd parameter so that undefined stays undefined

