/*
	wrival.js
	By Justin L. Fisher
	http://www.wrival.org
*/
	
	
	// Listeners.
	window.addEventListener("load",function () {
		wrival.init();
	});
	window.addEventListener("popstate",function (event) {
		wrival.ajax(event.state.url,event.state.target,true,event.state.title,false,true,false);
	});
	
	
	// Scope: "wrival" is the only public name.
	var wrival = {
		
		defaults: {},		// (title,load,target,remember)
		default: "",		// initial page to load
		title: "",		// initial title
		target: "",		// initial target
		dimmer: true,		// dim while loading
		dim: 0.4,		// dim to 40%
		cursor: true,		// change cursor to wait
		swapscroll: true,	// scroll to target if off screen
		swapoffset: 120,	// adjust scroll position
		nav: true,		// do nav updates for links (title, scroll, history)
		navscroll: true,	// toggle scrolling for a nav load
		navtitle: true,		// toggle refreshing the title
		navhistory: true,	// toggle adding request to history
		appendurl: "",		// append a ?key=value to the url (e.g. for disabling templates)
		hashes: true,		// may to false if using server-side templates
		url: "",		// the document name last loaded
		
		
		loading: function (targetObject) {
			// Dim and set cursor (over target) to wait.
			
			if(wrival['dimmer']) {
				targetObject.style.opacity = wrival['dim'];
			}
			if(wrival['cursor']) {
				targetObject.style.cursor = "wait";
			}
		},
		
		
		loaded: function (targetObject) {
			// Opacity 100% once finished loading.
			
			if(wrival['cursor']) {
				targetObject.style.cursor = "auto";
			}
			if(wrival['dimmer']) {
				targetObject.style.opacity = "1";
			}
		},
		
		
		makeHandler: function (form,nav,href,hrefatt,target,title,swap) {
			// Rewrite what happens for the link passed.
			
			return function () {
				
				// Write to cookie if was "remember" (already exists if it did).
				var path = false;
				if((wrival.hashes)&&(wrival['nav'])&&(window.location.hash)) {
					path = window.location.hash.substr(1);
				} else {
					path = window.location.pathname;
				}
				if((path)&&(document.cookie.indexOf(path + ':' + target + '=') != -1)) {
					wrival.remember(hrefatt,target);
				}
				
				if(href.match(/\.(gif|jpg|jpeg|png)$/i)) {
					
					// Build <img> (image load will be done with the innerHTML)
					var imgtag = '<img src="' + href + '" alt="' + title + '">';
					document.getElementById(target).innerHTML = imgtag;
					
				} else if(swap) {
					
					// Treat as swap (e.g. div to div, nothing to load)
					document.getElementById(target).innerHTML = document.getElementById(hrefatt).innerHTML;
					// If target pos is above view, scroll to 100px above it, good??
					var targetrect = document.getElementById(target).getBoundingClientRect();
					var bodyrect = document.body.getBoundingClientRect();
					if((wrival['swapscroll'])&&(targetrect.top < 0)) {
						var difference = parseInt(document.documentElement.scrollTop) + parseInt(targetrect.top);
						var lessSpace = wrival['swapoffset']; // Scroll higher looks nicer.
						if(difference - lessSpace > 0) {
							difference -= lessSpace;
						} else if(difference <= lessSpace) {
							// Else already tight so just go to top
							difference = 0;
						}
						window.scrollTo(parseInt(bodyrect.left),difference);
					}
					wrival.updateLinks();
					
				} else {
					// Else, use ajax.
					wrival.ajax(hrefatt,target,nav,title,form,false,false);
				}
				
				return false;
			};
		},
		
		
		run: function (href,target,form,nav,title) {
			// Call as a wrival.js link (from JS).
			// wrival.run("/page.html","cotent",false,true,"Page Replacement");
			// wrival.run("/a.cgi","formid",true);
			
			if(form) {
				// If passed as true, convert it to the id's object.
				form = document.getElementById(href);
			}
			
			var swap = false;
			var targetexists = false;

			if(target != "") {
				if(document.getElementById(target)) {
					targetexists = true;
				}
				if((!href.match(/\/|\.|#/))&&(document.getElementById(href))) {
					// no illegals, target and href as an id exist
					swap = true;
				}
			}
			
			var hrefatt = href;
			if(href.match(/\?/)) {
				var parts = href.split(/\?/);
				hrefatt = parts[0];
			}
			
			if((href)&&(target)) {
				// Apply action.
				(wrival.makeHandler(form,nav,href,hrefatt,target,"",swap))();
			}
		},
		
		
		readTag: function (link) {
			// Send a link to make a handler for it (if needed).
			
			var href = link.href;
			var hrefatt = "";
			
			if(link.attributes['href']) {
				hrefatt = link.attributes['href'].value;
			} else {
				return;
			}
			
			var target = link.target;
			var title = link.title;
			var swap = false;
			var targetexists = false;
			
			if(target != "") {
				if(document.getElementById(target)) {
					targetexists = true;
				}
				if((!hrefatt.match(/\/|\.|#/))&&(document.getElementById(hrefatt))) {
					// no illegals, target and href as an id exist
					swap = true;
				}
			}
			
			if(targetexists) {
				
				// See if it's in a <nav>.
				var nav = wrival.checkNav(link);
				var form = "";
				
				// Make the onclick.
				// Set the link to return false.
				link.onclick = wrival.makeHandler(form,nav,href,hrefatt,target,title,swap);
			// NOT WORKING FOR SOME BROWSERS...
			//	link.addEventListener("click",wrival.makeHandler(form,nav,href,hrefatt,target,title,swap));
			//	link.onclick = function () { return false; };
			}
		},
		
		
		updateLinks: function () {
			
			// 1/2. Update behavior of all qualifying LINKS.
			
			var links = document.getElementsByTagName("a");
			
			for(var i=0; i < links.length; i++) {
				wrival.readTag(links[i]);
			}
			
			// 2/2. Update behavior of all qualifying FORMS.
			
			var forms = document.getElementsByTagName("form");
			
			for(var i=0; i < forms.length; i++) {
				
				var action = forms[i].action;
				var actionatt = "";
				if(forms[i].attributes['action']) {
					actionatt = forms[i].attributes['action'].value;
				} else {
					continue;
				}
				var target = forms[i].target;
				var title = forms[i].title;
				var targetexists = false;
				if(target != "") {
					if(document.getElementById(target)) {
						targetexists = true;
					}
				}
				
				if((targetexists)||(target == "")) {
					
					// See if it's in a <nav>.
					var nav = wrival.checkNav(forms[i]);
					var form = forms[i];
					
					// Make the onsubmit.
					forms[i].onsubmit = wrival.makeHandler(form,nav,action,actionatt,target,title,false);
				}
			}
		},
		
		
		checkNav: function (element) {
			
			// See if it's in a <nav>.
			var nav = false;
			var node = element.parentNode;
			while(node != null) {
				if(node.tagName == "NAV") {
					nav = true;
					break;
				}
				node = node.parentNode;
			}
			return nav;
		},
		
		
		init: function () {
			// Convert qualifying links once dom is loaded.
			
			var pathname = window.location.pathname;
			
			if(wrival.hashes) {
				if((wrival['nav'])&&(window.location.hash)) {
					// Override default if a hash is in the url.
					wrival['default'] = window.location.hash.substr(1);
					var parts = wrival['default'].split(/\?/);
					var hash = parts[0];
					if(wrival['defaults'][pathname]['target']) {
						// Set target if a direct hash load.
						wrival['target'] = wrival['defaults'][pathname]['target'];
					}
					if(wrival['defaults'][hash]['title']) {
						// Set title if a direct hash load.
						wrival['title'] = wrival['defaults'][hash]['title'];
					}
				}
			} else if((wrival['nav'])&&(wrival['defaults'].hasOwnProperty(pathname))) {
				if(wrival['defaults'][pathname].hasOwnProperty('title')) {
					// Default page's title if no hash.
					wrival['title'] = wrival['defaults'][pathname]['title'];
				}
			}
			
			if((wrival['default'] != "")&&(wrival['target'] != "")) {
					
				// Use default and target.
				if(document.getElementById(wrival['target'])) {
					// Target id exists so try it!
					wrival.ajax(wrival['default'],wrival['target'],true,wrival['title'],"",false,true);
				}
			} else if(wrival['defaults'].hasOwnProperty(pathname)) {
				
				if((wrival['defaults'][pathname]['load'])&&(wrival['defaults'][pathname]['target'])) {
					
					// load: load1,load2 (can load multiple things)
					// target: here1,here2 (just keep same sequence)
					var loads = wrival['defaults'][pathname]['load'].split(/,/);
					var targets = wrival['defaults'][pathname]['target'].split(/,/);
					
					for(var i = 0; i < loads.length; i++) {
						// Use defaults' load and target.
						if(document.getElementById(targets[i])) {
							wrival.ajax(loads[i],targets[i],true,"","",false,true);
						}
					}
				} else {
					
					// Just update links if there was no load.
					wrival.updateLinks();
					
					// Setup replace history.
					var url = "";
					if((wrival.hashes)&&(wrival['nav'])&&(window.location.hash)) {
						url = window.location.hash.substr(1);
					} else {
						url = window.location.pathname;
					}
					var parts = url.split(/\?/);
					url = parts[0];
					
					if(wrival['defaults'][url]['title']) {
						// Set title if a direct hash load.
						wrival['title'] = wrival['defaults'][url]['title'];
					}
					if(wrival['defaults'][url]['target']) {
						// Set title if a direct hash load.
						wrival['target'] = wrival['defaults'][url]['target'];
					}
					
					wrival.writeHistory(url,wrival.target,wrival.title,false,false,true);
				}
			} else {
				// Just update links.
				wrival.updateLinks();
			}
			
			var url = document.location.pathname;
			if(wrival['defaults'].hasOwnProperty(url)) {
				var target = wrival['defaults'][url]['target'];
				var remember = wrival['defaults'][url]['remember'];
				wrival.defaultLoader(url,target,remember);
			}
		},
		
		writeHistory: function (url,target,title,form,wentback,initload) {
			
			if((url == "")||(target == "")||(title == "")) {
				// Required info.
				return;
			}
			
			// Remove append form url if needed.
			var stateurl = url;
			if(wrival.appendurl != "") {
				// Remove custom appendurl from stateurl.
				var regexp = new RegExp("[?]?&" + wrival['appendurl'] + "$");
				stateurl = stateurl.replace(regexp,"");
			}
			
			var state = {
				url: stateurl,
				target: target,
				title: title
			};
			
			if(wrival.hashes) {
				stateurl = "#" + stateurl;
			}
			
			if(wentback||initload) {
				window.history.replaceState(state,title,stateurl);
			} else {
				window.history.pushState(state,title,stateurl);
			}
		},
		
		
		ajax: function (url,target,nav,title,form,wentback,initload) {
			// Process ajax requests including first reading forms if needed.
			
			// Assign url and title.
			wrival['url'] = url;
			wrival['title'] = title;
			
			var Outside = false;
			
			if(!url.match(/:/i)) {
				Outside = true;
			}
			
			wrival['target'] = target;
			var targetObject = document.getElementById(target); // DOM it once.
			
			// Start loading actions (default: dim content.)
			wrival.loading(targetObject);
			
			// Appending fields for GET with request (for if a form submit).
			var send = "";
			
			// If form, prep fields to be sent with request.
			if(form != "") {
				
				for(i = 0; i < form.length; i++) {
					
					if(form.elements[i].name == "") {
						// Skipping if no name.
						continue;
					}
					
					var value = "";
					var checkboxtest = 0;
					
					// Checkbox
					if(form.elements[i].type == "checkbox") {
						checkboxtest = 1;
						if(form.elements[i].checked) {
							checkboxtest = 0;
							value = form.elements[i].value;
						}
					}
					// File
					else if(form.elements[i].type == "file") {
						value = form.elements[i].value;
						fileinputs = 1;
					}
					// Radio
					else if(form.elements[i].type == "radio") {
						var test = document.getElementsByName(form.elements[i].name);
						radios = test.length;
						for(j = 0; j < radios; j++) {
							if(test[j].checked == true) {
								value = test[j].value;
							}
						}
					}
					// Select
					else if(form.elements[i].type == "select") {
						value = form.elements[i].selected.value;
					}
					// Text, Hidden, Textarea, (File, but no upload, use AjaxUpload instead)
					else {
						value = form.elements[i].value;
					}
					
					if(checkboxtest == 0) {
						send += form.elements[i].name + "=" + encodeURIComponent(value) + "&";
					}
				}
				
				// Remove last &.
				send = send.substring(0, send.length - 1);
				
			}
			if(send != "") {
				if(!url.match(/\?/)) {
					url += "?";
				}
				url = url + "&" + send;
			}
			
			// wrival.appendurl passed to server if it's not empty.
			if(wrival.appendurl) {
				if(!url.match(/\?/)) {
					url += "?";
				}
				url = url + "&" + wrival.appendurl;
			}
			
			var request = new XMLHttpRequest();
			var method = "GET";
			var test = /post/i;
			if(test.test(form.method)) {
				method = "POST";
			}
			request.open(method,url,true);
			if(method == "POST") {
				request.setRequestHeader('Content-type','application/x-www-form-urlencoded');
			}
			request.onreadystatechange = function () {
				
				if((request.readyState == 4)&&(request.status == 200)) {
					
					// Populate an element by ID with the request.
					document.getElementById(target).innerHTML = request.responseText;
					
					// Get and then run any script in response.
					var scripts = document.getElementById(target).getElementsByTagName("script");
					
					for(var i = 0; i < scripts.length; i++) {
						if(scripts[i].text != null) {
							if(Outside) {
								// Creates it own scope
								eval(scripts[i].innerHTML);
							} else {
								// Adds it to the window scope
								eval.call(window,scripts[i].innerHTML);
							}
						}
					}
					
					// Update links since we have new content.
					wrival.updateLinks();
					
					// If nav, update history, title, etc.
					if((wrival['nav'])&&(nav)) {
						
						if(wrival['navscroll']) {
							// Scroll to top.
							window.scrollTo(0,0);
						}
						if(wrival['navtitle']) {
							// Set title.
							if(title != "") {
								// If title attribute was in link.
								document.title = title;
							} else {
								// Try in wrival.defaults
								var parts = url.split(/\?/);
								var pathname = parts[0];
								if(wrival['defaults'][pathname]['title']) {
									document.title = wrival['defaults'][pathname]['title'];
								}
							}
						}
						if(wrival['navhistory']) {
							// Update history.
							wrival.writeHistory(url,target,title,form,wentback,initload);
						}
					}
					
					// Give focus to what was just loaded.
					targetObject.focus();
					
					if(url.match(/\?/)) {
						var parts = url.split(/\?/);
						url = parts[0];
					}
					
					// Finished loaded action (default: opacity to 100%)
					wrival['target'] = target;
					if(wrival['defaults'][url]) {
						if((wrival['defaults'][url]['load'])&&(wrival['defaults'][url]['target'])) {
							var remember = false;
							if(wrival['defaults'][url]['remember']) {
								remember = wrival['defaults'][url]['remember'];
							}
							// Check type.
							wrival.defaultLoader(wrival['defaults'][url]['load'],wrival['defaults'][url]['target'],remember);
						}
					}
					
					wrival.loaded(targetObject);
				}
			};
			
			// Send request.
			request.send(send);
		},
		
		
		defaultLoader: function (href,target,remember) {
			// After a request is done also request "load or "default".
			
			var swap = false;
			var targetexists = false;
			var targetObject = document.getElementById(target);
			
			if(targetObject) {
				targetexists = true;
			}
			if((!href.match(/\/|\.|#/))&&(document.getElementById(href))) {
				// no illegals, target and href as an id exist
				swap = true;
			}
			
			if(targetexists) {
				
				// First, if cookie override with it's href.
				// (since this is a default load)
				
				var path;
				if((wrival.hashes)&&(wrival['nav'])&&(window.location.hash)) {
					path = window.location.hash.substr(1);
				} else {
					path = window.location.pathname;
				}
				
				if(document.cookie.indexOf(path + ':' + target + '=') != -1) {
					// It exists so reset "href" with it.
					
					var value = wrival.getCookie(path + ':' + target);
					if(value) {
						href = value;
					}
				}
				
				// Write to cookie if necessary.
				if(remember == target) {
					wrival.remember(href,target);
				}
				
				if((!href.match(/\/|\.|#/))&&(document.getElementById(href))) {
					// no illegals, target and href as an id exist
					swap = true;
				}
				
				// Apply action.
				(wrival.makeHandler("","",href,href,target,"",swap))();
				wrival.loaded(targetObject);
			}
		},
		
		
		getCookie: function (name) {
			// Get a cookie by name.
			
			var value = "; " + document.cookie;
			var parts = value.split("; " + name + "=");
			if(parts.length == 2) {
				return parts.pop().split(";").shift();
			}
		},
		
		
		remember: function (href,target) {
			// Write cookie for remembering last link clicked for a target.
			
			var path;
			if((wrival.hashes)&&(wrival['nav'])&&(window.location.hash)) {
				path = window.location.hash.substr(1);
			} else {
				path = window.location.pathname;
			}
			document.cookie = path + ':' + target + '=' + href + '; path=/;';
		}
	};
