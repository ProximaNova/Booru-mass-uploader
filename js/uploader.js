if (!XMLHttpRequest.prototype.sendAsBinary) {
  XMLHttpRequest.prototype.sendAsBinary = function (sData) {
    var nBytes = sData.length, ui8Data = new Uint8Array(nBytes);
    for (var nIdx = 0; nIdx < nBytes; nIdx++) {
      ui8Data[nIdx] = sData.charCodeAt(nIdx) & 0xff;
    }
    /* send as ArrayBufferView...: */
    this.send(ui8Data);
    /* ...or as ArrayBuffer (legacy)...: this.send(ui8Data.buffer); */
  };
}

var settingsToSave = ['tags', 'source'];
var checkboxesToSave = ['forceRating', 'ratingAsDefault', 'setSafe', 'setQuest', 'setExplicit', 'forceTags', 'addTags', 'title'];

var myTags = (GetCookie('tags')||'').replace(/%2520/gi,' ').replace(/%20/gi,' ').split(/\s+/);
if (myTags.length) {
	$show('mytags');
	var tagsArea = '';
	$each(myTags, function(tag){
		tagsArea += '&nbsp;<a style="text-decoration:none;" href="#'+tag+'" id="t_'+tag+'"' + "onclick=\"javascript:toggleTags('"+tag+"','tags','t_"+tag+"');" + 'return false;">'+tag+'</a> ';
	});
	$('my-tags').innerHTML = tagsArea;
}; 

function toggleTags(tag, id, lid)
	{
		temp = new Array(1);
		temp[0] = tag;
			tags = $('tags').value.split(" ");
		if(tags.include(tag))
		{
				$('tags').value=tags.without(tag).join(" ").trim()+' ';
			$(lid).innerHTML=tag+" ";
		}
		else
		{
				$('tags').value=tags.concat(temp).join(" ").trim()+' ';
			$(lid).innerHTML="<b>"+tag+"</b> ";
		}
		return false;
	}

RestoreLastSettings();
UploadOptions();

var upOptions = {running: false};

function FilesSelected(selFiles) {
	if (upOptions.running) 
		return;
	upOptions = UploadOptions();
    if (upOptions.auth.use && isNaN(upOptions.auth.userID)) {
		alert('Wrong user ID\u2014it must be a number.');
		return;
    }
    if (upOptions.auth.use && upOptions.auth.ticket.length != 40) {
		alert('Wrong ticket\u2014it must be 40 characters long.');
		return;
	}

  upOptions.running = true;

  try {
    var files = [];
    $each(selFiles, function (file) {
		if (IsUploadable(file))
			files.push(file);
	});
	SendFiles(files);
  } catch (e) {
    if (typeof e == 'string') 
		alert('Couldn\'t upload\u2014' + e);
  }
}

function IsUploadable(file) {
	return (typeof file.type == 'string' ? file.type.substr(0, 6) == 'image/' : true)
		&& /(jpe?g|gif|png|bmp)$/i.test(file.name);
}

function OnFirstUpload(files) {
    SaveLastSettings();
    Log('info', 'Started uploading ' + upOptions.stats.total + ' files.');
    UpdateUpProgress(0);
}

function OnAllUploaded() {
    upOptions.running = false;

    var msg = 'Finished uploading; ' + upOptions.stats.success + ' uploaded ok + ' +
                upOptions.stats.failed + ' failed = ' +
                upOptions.stats.total + ' images total.';
    Log('info end', msg);

    $set('status', '');
    UpdateUpProgress(0);

    var ourBooru = upOptions.uploadURL.match(/^http:\/\/([\w\d-]+)\.booru\.org\//i);
    if (ourBooru) {
		var baseCtrUpdURL = 'http://booru.org/?action=updateimagecount&updateimagecount[booru]=';
        var image = new Image();
        image.src = baseCtrUpdURL + ourBooru[1] + '&rand=' + Math.random();
    }
	$('files').files = [];
	$('files').value = '';
}

function UploadOptions() {
    var rating = {
		when:$('forceRating').checked ? 'always' : 'default',
        set: $('setSafe').checked ? 's' :
			 $('setQuest').checked ? 'q' : 'e'
	};

    var tagging = {
		when:$('forceTags').checked ? 'always' : 'add',
        set: $get('tags').toLowerCase().split(/\s+/)
	};

    var auth = {
		userID: GetCookie('user_id'),
		ticket: GetCookie('pass_hash')
	};
    auth.use = auth.userID && auth.ticket;
	
	document.getElementById('loggedIn').textContent = auth.use ? 'You are logged in' : 'You are posting anonymously';

	var uploadURL = document.location.protocol+'//'+document.location.hostname+'/index.php?page=post&s=add';
	
    return {delay: 1000, uploadURL: uploadURL, title: document.getElementById('title').checked,
            rating: rating, tagging: tagging, source: $get('source'),
            stats: {total: 0, success: 0, failed: 0}, auth: auth};
  }

function Log(className, msg) {
	var now = new Date;
	msg = '[' + now.getHours() + ':' + now.getMinutes() + '] ' + msg;

    $show('log');

	if ($('log').childNodes.length > 200) {
		var log = $('log');
		while (child = log.firstChild) { log.removeChild(child); }
	}

    var line = document.createElement('div');
        line.className = className;
        line.innerHTML = EscapeHTML(msg);

    $('log').appendChild(line);
  }

function EscapeHTML(str) {
	var entity = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};
	return str.replace(/&|<|>/g, function (ch) {
		return entity[ ch[0] ];
	});
}

function LogSuccess(file) {
	Log('success', 'Image ' + file.name + ' was successfully uploaded.');
	upOptions.stats.success++;
}

function LogFailure(file, reason) {
	Log('error', 'Couldn\'t upload ' + file.name + ': ' + reason + '.');
	upOptions.stats.failed++;
}

function SendFiles(files, index) {
    index = index || 0;

    if (index < files.length) {
		if (index == 0) {
			upOptions.stats.total = files.length;
			OnFirstUpload(files);
		}
		SendFile( files[index], function () { SendFiles(files, index + 1); } );
		$set('status', 'Uploading #' + (index + 1) + ' image out of ' + files.length + '...');
    } else 
		OnAllUploaded();    
}

function SendFile(file, callback) {
	var reqVars = {
		title:  TitleFor(file), tags: TagsFor(file),
		rating: RatingFor(file), submit: 'Upload',
		source: upOptions.source
	};
	if (upOptions.auth.use) 
		reqVars.cookies = 'user_id=' +   upOptions.auth.userID + '; ' + 'pass_hash=' + upOptions.auth.ticket;

	var xhr = CreateXHRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && (this.status == 200 || this.status == 304 /*not modified*/)) {
			// "mage" instead of "image" because first "I" might be capitalized.
			if (this.responseText.indexOf('mage added') != -1) 
				LogSuccess(file)
			else if (this.responseText.indexOf('already exists') != -1) 
				LogFailure(file, 'this image already exists')
			else if (this.responseText.indexOf('permission') != -1) {
				LogFailure(file, 'no permissions');
				var msg = 'Could not upload this image\u2014the board says that we have no permissions.\nCheck if you are logged in. Stopped.';
				alert(msg);
				OnAllUploaded();
				throw msg;
			} else 
				LogFailure(file, 'wrong response, check your posting form URL');

			UpdateUpProgress( (upOptions.stats.success + upOptions.stats.failed) / upOptions.stats.total );
			setTimeout(callback, upOptions.delay);
		}
	}

	var boundary = '--bOh3aYae';
	var EOLN = "\r\n";

	var postVars = '';

	for (var name in reqVars) {
		postVars += boundary + EOLN +
			'Content-Disposition: form-data; name="' + name + '"' + EOLN + EOLN + 
			reqVars[name] + EOLN;
	}

	var reader = new FileReader;
	reader.onloadend = function () {
		var data = boundary + EOLN +
			'Content-Disposition: form-data; name="upload";' + ' filename="' + file.name + '"' + EOLN +
			'Content-Type: application/octet-stream' + EOLN +
			'Content-Transfer-Encoding: binary' + EOLN + EOLN +
			reader.result + EOLN +
			postVars + boundary + '--';

		xhr.open('POST', upOptions.uploadURL);
		xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary.substr(2));
		xhr.setRequestHeader('Content-Length', data.length);
		xhr.sendAsBinary(data);
	}
	reader.readAsBinaryString(file);
}

function UpdateUpProgress(percent) {
	WidthOf('progress', WidthOf('progressWr') * percent);
}

function RatingFor(file){ return InfoAbout(file)[0];}
function TagsFor(file) 	{ return NormTags (InfoAbout(file)[1] );}
function TitleFor(file) { return InfoAbout(file)[2];}

function InfoAbout(file) {
	var fileName = file.name.toLowerCase();

	var ext = fileName.match(/ *\.(\w{2,4})$/i);
	if (ext)
		fileName = fileName.replace(ext[0], '');

	if (!ext)
		throw 'File ' + file.name + ' have no extension.'
	else
		ext = ext[1];

	var rating = fileName.match(/^([sqe])( +|$)/i);
	if (rating)
		fileName = fileName.replace(rating[0], '');

	if (upOptions.rating.when == 'always' || !rating) 
		rating = upOptions.rating.set 
	else 
		rating = rating[1];

	var tags  = fileName;
	var title = upOptions.title?tags.split(/\s+/)[tags.split(/\s+/).length-1]:'';
	return [rating, tags, title];
}

function NormTags(tags) {
	tags = tags.toLowerCase().split(/\s+/);
	tags.pop();
	
	if (tags.length >= 2)	 {	
		tags = mkUniq(tags);
		if (tags[0] == '')
			tags.shift(); 
	}
	
	switch (upOptions.tagging.when) {
		case 'always':
			tags = [];
		case 'add':
			tags = tags.concat(upOptions.tagging.set);
			tags = mkUniq(tags);
	}
	return tags.join(' ');
}

function mkUniq(arr) {
	var to = {};
	for (var v = 0; v< arr.length; v++){
		to[arr[v].toLowerCase()] = true;
	};
	arr2 = Object.keys(to);
	return arr2.sort();	
}

function RestoreLastSettings() {
	var cookieBaseName = 'last@BMU:';

	$each(settingsToSave, function (setting) {
		var lastValue = GetCookie(cookieBaseName + setting);
		if (lastValue && (!$get(setting) || setting == 'source')) 
			$set(setting, lastValue);
	});

	$each(checkboxesToSave, function (setting) {
		var lastValue = GetCookie(cookieBaseName + setting);
		if (IsNum(lastValue))
			$(setting).checked = lastValue == '1'; 
	});
}

function SaveLastSettings() {
    var cookieBaseName = 'last@BMU:';

    $each(settingsToSave, function (setting) {
		SetCookie( cookieBaseName + setting, $get(setting), 7 * 24 * 3600 );
    });
	
	$each(checkboxesToSave, function (setting) {
		SetCookie( cookieBaseName + setting, $(setting).checked ? '1' : '0', 7 * 24 * 3600 );
    });
}
