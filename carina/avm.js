/*
 * Javascript AVM/XMP Reader 0.1.3
 * Copyright (c) 2010 Stuart Lowe http://www.strudel.org.uk/
 * Astronomy Visualization Metadata (AVM) is defined at:
 * http://www.virtualastronomy.org/avm_metadata.php
 *
 * Licensed under the MPL http://www.mozilla.org/MPL/MPL-1.1.txt
 *
 * Requires Jacob Seidelin's binaryajax.js from http://www.nihilogic.dk/labs/exif/
 */

function AVM(input){
	this.id = (input) ? input : "";
	this.img = { complete: false };
	this.xmp = "";	// Will hold the XMP string (for test purposes)
	this.avmdata = false;
	this.tags = {}
	this.AVMdefinedTags = {
		'Creator':'photoshop:Source',
		'CreatorURL':'Iptc4xmpCore:CiUrlWork',
		'Contact.Name':'dc:creator',
		'Contact.Email':'Iptc4xmpCore:CiEmailWork',
		'Contact.Telephone':'Iptc4xmpCore:CiTelWork',
		'Contact.Address':'Iptc4xmpCore:CiAdrExtadr',
		'Contact.City':'Iptc4xmpCore:CiAdrCity',
		'Contact.StateProvince':'Iptc4xmpCore:CiAdrRegion',
		'Contact.PostalCode':'Iptc4xmpCore:CiAdrPcode',
		'Contact.Country':'Iptc4xmpCore:CiAdrCtry',
		'Rights':'xapRights:UsageTerms',
		'Title':'dc:title',
		'Headline':'photoshop:Headline',
		'Description':'dc:description',
		'Subject.Category':'avm:Subject.Category',
		'Subject.Name':'dc:subject',
		'Distance':'avm:Distance',
		'Distance.Notes':'avm:Distance.Notes',
		'ReferenceURL':'avm:ReferenceURL',
		'Credit':'photoshop:Credit',
		'Date':'photoshop:DateCreated',
		'ID':'avm:ID',
		'Type':'avm:Type',
		'Image.ProductQuality':'avm:Image.ProductQuality',
		'Facility':'avm:Facility',
		'Instrument':'avm:Instrument',
		'Spectral.ColorAssignment':'avm:Spectral.ColorAssignment',
		'Spectral.Band':'avm:Spectral.Band',
		'Spectral.Bandpass':'avm:Spectral.Bandpass',
		'Spectral.CentralWavelength':'avm:Spectral.CentralWavelength',
		'Spectral.Notes':'avm:Spectral.Notes',
		'Temporal.StartTime':'avm:Temporal.StartTime',
		'Temporal.IntegrationTime':'avm:Temporal.IntegrationTime',
		'DatasetID':'avm:DatasetID',
		'Spatial.CoordinateFrame':'avm:Spatial.CoordinateFrame',
		'Spatial.Equinox':'avm:Spatial.Equinox',
		'Spatial.ReferenceValue':'avm:Spatial.ReferenceValue',
		'Spatial.ReferenceDimension':'avm:Spatial.ReferenceDimension',
		'Spatial.ReferencePixel':'avm:Spatial.ReferencePixel',
		'Spatial.Scale':'avm:Spatial.Scale',
		'Spatial.Rotation':'avm:Spatial.Rotation',
		'Spatial.CoordsystemProjection':'avm:Spatial.CoordsystemProjection',
		'Spatial.Quality':'avm:Spatial.Quality',
		'Spatial.Notes':'avm:Spatial.Notes',
		'Spatial.FITSheader':'avm:Spatial.FITSheader',
		'Spatial.CDMatrix':'avm:Spatial.CDMatrix',
		'Publisher':'avm:Publisher',
		'PublisherID':'avm:PublisherID',
		'ResourceID':'avm:ResourceID',
		'ResourceURL':'avm:ResourceURL',
		'RelatedResources':'avm:RelatedResources',
		'MetadataDate':'avm:MetadataDate',
		'MetadataVersion':'avm:MetadataVersion'
	}
}

AVM.prototype.load = function(fnCallback){
	if(this.id){
		this.img = document.getElementById(this.id);
		if(!this.img.complete) {
			var _obj = this;
			addEvent(this.img, "load", 
				function() {
					_obj.getData(fnCallback);
				}
			); 
		}else{
			this.getData(fnCallback);
		}
	}
}

AVM.prototype.getData = function(fnCallback){
	if(!this.imageHasData()){
		this.getImageData(this.img, fnCallback);
	}else{
		if(typeof fnCallback=="function") fnCallback(this);
	}
	return true;
}

AVM.prototype.getImageData = function(oImg, fnCallback) {
	var _obj = this;
	BinaryAjax(
		oImg.src,
		function(oHTTP) {
			var oAVM = _obj.findAVMinJPEG(oHTTP.binaryResponse);
			oImg.avmdata = true;
			_obj.tags = oAVM || {};
			if (typeof fnCallback=="function") fnCallback(_obj);
		}
	)
}

if(typeof addEvent!="function"){
	function addEvent(oElement, strEvent, fncHandler){
		if (oElement.addEventListener) oElement.addEventListener(strEvent, fncHandler, false); 
		else if (oElement.attachEvent) oElement.attachEvent("on" + strEvent, fncHandler); 
	}
}

AVM.prototype.imageHasData = function() {
	return (this.img.avmdata);
}

AVM.prototype.findAVMinJPEG = function(oFile) {
	if (oFile.getByteAt(0) != 0xFF || oFile.getByteAt(1) != 0xD8) return false; // not a valid jpeg

	var iOffset = 2;
	var iLength = oFile.getLength();
	while (iOffset < iLength) {
		if (oFile.getByteAt(iOffset) != 0xFF) return false; // not a valid marker, something is wrong
		var iMarker = oFile.getByteAt(iOffset+1);

		// we could implement handling for other markers here, 
		// but we're only looking for 0xFFE1 for AVM data

		if (iMarker == 22400) {
			return this.readAVMData(oFile, iOffset + 4, oFile.getShortAt(iOffset+2, true)-2);
			iOffset += 2 + oFile.getShortAt(iOffset+2, true);

		} else if (iMarker == 225) {
			// 0xE1 = Application-specific 1 (for AVM)
			var oTags = this.readAVMData(oFile, iOffset + 4, oFile.getShortAt(iOffset+2, true)-2);
			return oTags;
		} else {
			iOffset += 2 + oFile.getShortAt(iOffset+2, true);
		}
	}
}

AVM.prototype.readAVMData = function(oFile, iStart, iLength){
	var oTags = {};
	this.xmp = this.readXMP(oFile);
	if (this.xmp) oTags = this.readAVM(this.xmp);
	return oTags;
}

AVM.prototype.readXMP = function(oFile) {
	var iEntries = oFile.getLength();
	var bBigEnd = false;
	var prev_n_hex = '';
	var record = false;
	var recordn = 0;
	// Find the XMP packet - 8 bit encoding (UTF-8)
	// see page 34 of http://www.adobe.com/devnet/xmp/pdfs/xmp_specification.pdf
	var xmpStr = '0x3C 0x3F 0x78 0x70 0x61 0x63 0x6B 0x65 0x74 0x20 0x62 0x65 0x67 0x69 0x6E 0x3D 0x22 0xEF ';
	var xmpBytes = 16;
	var byteStr = '';
	var iEntryOffset = -1;

	// Here we want to search for the XMP packet starting string
	// There is probably a more efficient way to search for a byte string
	for (var i=0;i<iEntries;i++) {
		var n = oFile.getByteAt(i, bBigEnd);
		var n_hex = n.toString(16).toUpperCase();
		if(n_hex.length == 1) n_hex = "0x0"+n_hex;
		if(n_hex.length == 2) n_hex = "0x"+n_hex;
		if(prev_n_hex == "0x3C" && n_hex == "0x3F"){
			record = true;
			recordn = xmpBytes;
			byteStr = '0x3C ';
		}
		if(record){
			byteStr += n_hex+' ';
			recordn--;
			if(recordn < 0){
				if(byteStr == xmpStr){
					var iEntryOffset = i-xmpBytes;
					break;
				}
				record = false;
			}
		}
		prev_n_hex = n_hex;
	}
	if(iEntryOffset >= 0){
		var str = '';
		var i = iEntryOffset;
		while(str.indexOf('</x:xmpmeta>') < 0 && i < (iEntryOffset+20000)){
			str += oFile.getCharAt(i);
			i++;
		}
		return str;
	}
}

AVM.prototype.readAVM = function(str) {
	var oTags = {};
	if(str.indexOf('xmlns:avm') >= 0){
		for (var key in this.AVMdefinedTags) {
			var keyname = key;
			key = this.AVMdefinedTags[key];
			key.toLowerCase();
			var start = str.indexOf(key)+key.length+2;
			var final = str.indexOf('"',start);
			// Find out what the character is after the key
			var char = str.substring(start-2,start-1);
			if(char == "="){
				oTags[keyname] = str.substring(start,final);
			}else if(char == ">"){
				final = str.indexOf('</'+key+'>',start);
				// Parse out the HTML tags and build an array of the resulting values
				var tmpstr = str.substring(start,final);
				var tmparr = new Array(0);
				tmpstr = tmpstr.replace(/[\n\r]/g,"");
				tmpstr = tmpstr.replace(/ +/g," ");
				tmparr = tmpstr.split(/ ?<\/?[^>]+> ?/g);
				var newarr = new Array(0);
				for(var i = 0;i<tmparr.length;i++){
					if(tmparr[i].length > 0) newarr.push(tmparr[i]);
				}
				oTags[keyname] = newarr;
			}
		}
	}
	return oTags;
}
