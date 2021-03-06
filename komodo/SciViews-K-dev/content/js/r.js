// SciViews-K R functions
// Define functions to pilot R from Komodo Edit 'sv.r' & 'sv.r.pkg'
// Copyright (c) 2008-2009, Ph. Grosjean (phgrosjean@sciviews.org) & K. Barton
// License: MPL 1.1/GPL 2.0/LGPL 2.1
////////////////////////////////////////////////////////////////////////////////
// To cope with versions incompatibilities, we define this:
// sv.alert(sv.r.RMinVersion); // Display minimum R version required
// sv.r.server; // Which kind of R server is used? Either 'http' or 'socket'
// sv.r.sep; // Item separator that R should use returning data.
// sv.r.running; // Is the linked R interpreter currently running?
// sv.r.test();  // Check if an R interpreter is communicating with us
//
// sv.r.print(text, newline, command, partial); // Print to local R console
// sv.r.eval(cmd); // Evaluate 'cmd' in R
// sv.r.evalHidden(cmd, earlyExit); // Evaluate 'cmd' in R in a hidden way
// sv.r.evalCallback(cmd, procfun, ...); // Evaluate 'cmd' in R and call 'procfun'
// sv.r.escape(cmd); // Escape R multiline mode, 'cmd' to run then
// sv.r.setwd(); // Set the working dir (choose or set to current buffer)
// sv.r.run(); // Run current selection or line in R and goto next line
// sv.r.runEnter(breakLine = false); // Run current line to pos in R
// and add a line feed
// sv.r.source(what); // Source various part of current buffer to R
// sv.r.send(what); // Send various part of current buffer to R
// sv.r.display(topic, what); // Display 'topic' according to 'what' type
// sv.r.help(topic, package); // Get help in R for 'topic', 'package' is optional
// sv.r.example(topic); // Run example in R for 'topic', 'topic' is optional
// sv.r.search(topic); // Search R help for 'topic'
// sv.r.search_select(topics); // Callback function: display a list of
// choices to select help page from
// sv.r.siteSearch(topic); // Search R web sites for 'topic'
// sv.r.saveWorkspace(file, title);  // Save data in a .Rdata file
// sv.r.loadWorkspace(file, attach); // Load the content of a .RData file into
// the workspace, or attach it
// sv.r.saveHistory(file, title); // Save the history in a file
// sv.r.loadHistory(file, title); // Load the history from a file
// sv.r.saveGraph(type, file, title, height, width, method);
//                  // Save the current R graph in different formats
// sv.r.refreshSession(); // Refresh MRU lists associated with current session
// sv.r.initSession(dir, datadir, scriptdir, reportdir);
// sv.r.setSession(dir, datadir, scriptdir, reportdir, saveOld, loadNew);
// Initialize R session with corresponding directories
// setSession() also do the change in R and is to be used
// preferably, except at Komodo startup!
// dir: session directory, xxxdir: xxx subdirectory,
// saveOld (default true): do we save old session data?
// loadNew (default true): do we load data from new session?
// sv.r.switchSession(inDoc); // Switch to another R session (possibly create it)
// sv.r.exploreSession(); // Explore the session dirs in default file browser
// sv.r.clearSession();   // Clear session's .RData and .Rhistory files
// sv.r.reloadSession();  // Reload .RData nd .Rhistory files from session dir
// sv.r.quit(save); // Quit R (ask to save in save in not defined)

// Note: sv.rbrowser is implemented in robjects.js
//       sv.r.console functions are implemented in rconsole.js
//
// sv.r.pkg namespace: /////////////////////////////////////////////////////////
// sv.r.pkg.repositories(); // Select repositories for installing R packages
// sv.r.pkg.chooseCRANMirror(andInstall); // replacement for .CRANmirror,
// optionally calls .install after execution
// sv.r.pkg.available();    // List available R packages on selected repository
// sv.r.pkg.installed();    // List installed R packages
// sv.r.pkg.new(); // List new R packages available on CRAN
// sv.r.pkg.old(); // List older installed R packages than distributed versions
// sv.r.pkg.update(); // Update installed R packages from the repositories
// sv.r.pkg.status(); // Show status of installed R packages
// sv.r.pkg.loaded(); // Show which R packages are loaded
// sv.r.pkg.load(); // Load one R package
// sv.r.pkg.unload(); // Unload one R package
// sv.r.pkg.unload_select(pkgs); // Callback function for sv.r.pkg.unload()
// sv.r.pkg.remove(); // Remove one R package
// sv.r.pkg.remove_select(pkgs); // Callback function for sv.r.pkg.remove()
// sv.r.pkg.install(pkgs, repos); // Install R package(s) from local files or repositories

////////////////////////////////////////////////////////////////////////////////
//
// TODO:
// * In overlay: add "source file" context menu item in the project tab

// Define the 'sv.r' namespace
if (typeof(sv.r) == 'undefined')
sv.r = {
	RMinVersion: "2.13.0",	// Minimum version of R required
	sep: ";;",				// Separator used for items
	running: false			// Indicate if R is currently running
	// FIXME: before we solve the issue of updating R status
};


// Evaluate R expression and call procfun in Komodo with the result as argument
// all additional arguments will be passed to procfun
sv.r.evalCallback = function(cmd, procfun, context) {
	var args = Array.apply(null, arguments)
	args.splice(2,  0, true, null, false)
	sv.rconn.eval.apply(sv.rconn, args)
}

sv.r.eval = function(cmd) sv.rconn.eval.call(sv.rconn, cmd)
sv.r.evalHidden = function(cmd, earlyExit) sv.rconn.eval.call(sv.rconn, cmd, null, true)
sv.r.escape = function (cmd) sv.rconn.escape(cmd);

// Set the current working directory (to current buffer dir, or ask for it)
sv.r.setwd = function (dir, ask, type) {
	// for compatibility with previous versions
	switch (arguments.length) {
		case 1: type = dir; dir = null; ask = false; break;
		case 2: type = dir; dir = null; break;
		default:
	}
	var getDirFromR = "";

	if (!dir || (sv.file.exists(dir) == 2)) { // Not there or unspecified
		switch (type) {
			case "this":
				break;
			case "session":
				getDirFromR = "getOption(\"R.initdir\")";
				break;
			case "previous":
				getDirFromR = "if (exists(\".odir\")) .odir else getwd()";
				break;
			case "init":
				getDirFromR = "getOption(\"R.initdir\")";
				break;
			case "current":
				getDirFromR = "getwd()";
				ask = true;	// Assume ask is always true in this case
				break;
			case "file":
				var view = ko.views.manager.currentView;
				if (view) {
					view.setFocus();
					if (!view.koDoc.isUntitled) dir = view.koDoc.file.dirName;
					break;
				} // Fallback: project directory
			case "project":
				try {
					var file = ko.places.manager.getSelectedItem().file;
					dir = file.isDirectory? file.path : file.dirName;
				} catch(e) {
					dir = sv.file.pathFromURI(ko.places.manager.currentPlace);
				}
			default:
		}
	}
	if (getDirFromR) {
		try {
			dir = sv.rconn.evalAtOnce("cat(path.expand(" + getDirFromR + "))");
		} catch(e) {
			dir = "";
		}
		if (!dir) {
			sv.alert(sv.translate("Cannot retrieve directory from R." +
				" Make sure R is running."));
				return(null);
		}
		if (navigator.platform.search(/^Win/) == 0) dir = dir.replace(/\//g, '\\');
	}

	if (ask || !dir)
		dir = ko.filepicker.getFolder(dir, sv.translate("Choose working directory"));

	if (dir != null) sv.r.eval(".odir <- setwd(\"" + dir.addslashes() + "\")");
    return(dir);
}

// Run current selection or line buffer in R
sv.r.run = function () {
	try {
		var view = ko.views.manager.currentView;
		if (!view) return(false); // No current view, do nothing!
		view.setFocus();

		var text = sv.getTextRange("sel", true);
		if(!text) { // No selection
			var scimoz = view.scimoz;
			var currentLine = scimoz.lineFromPosition(scimoz.currentPos);
			var scimoz = view.scimoz;
			var oText = { value: ''};
			var lineCount =	scimoz.lineCount;
			while(currentLine < lineCount && !(text = oText.value.trim()))
				scimoz.getLine(currentLine++, oText);
			scimoz.gotoLine(currentLine);
			text = oText.value.trim();
		}

		if(text) 	return(sv.rconn.eval(text));
		return(false);

	} catch(e) { return(e); }

}

// Run current line (or selection) up to position and optionally add line feed
sv.r.runEnter = function (breakLine) {
	try {
		var view = ko.views.manager.currentView;
		if (!view) return(false); // No current view, do nothing!
		view.setFocus();
		var scimoz = view.scimoz;
		var text = sv.getTextRange("sel", true);
		if (!text) {	// Only proceed if selection is empty
			// Get text from a line and move caret to the eol
			// Do we want to break line here or execute it to the end?
			text = sv.getTextRange(breakLine? "linetobegin" : "line", true);
		}
		ko.commands.doCommand('cmd_newlineExtra');
		var res = sv.r.eval(text);

	} catch(e) { return(e); }
	return(res);
}

// Source the current buffer or some part of it
sv.r.source = function (what) {
	var res = false;
	try {
		var view = ko.views.manager.currentView;
		if (!view) return(false); // No current view, do nothing!
		view.setFocus();
		var scimoz = view.scimoz;
		var doc = view.koDoc;

		var file;
		if (!doc.isUntitled && doc.file) {
			file = doc.file.path.addslashes();
		} else {
			file = doc.baseName;
		}

		if (!what) what = "all"; // Default value

		// Special case: if "all" and local document is saved,
		// source as the original file
		if (what == "all" && doc.file && doc.file.isLocal &&
		!doc.isUntitled && !doc.isDirty) {
			res = sv.r.eval('source("' + file +  '", encoding = "' +
			view.encoding + '")');
		} else {
			// Save all or part in the temporary file and source that file.
			// After executing, tell R to delete it.
			var code = sv.getTextRange(what);
			if (what == "function") {
				var rx = /(([`'"])(.+)\2|([\w\u0100-\uFFFF\.]+))(?=\s*<-\s*function)/;
				var match = code.match(rx);
				what += " \"" + (match? match[3] || match[4] : '') + "\"";
				//.replace(/^(['"`])(.*)\1/, "$2")
			}
			// Starting from R 2.14, there is a warning if the file does not
			// end with an empty line => add one now!
			code = code + "\n";
			
			sv.cmdout.clear();
			sv.cmdout.append(':> #source("' + file + '*") # buffer: ' + what);

			var tempFile = sv.file.temp();
			sv.file.write(tempFile, code + "\n", 'utf-8', false);
			tempFile = tempFile.addslashes();

			var cmd = 'tryCatch(source("' + tempFile + '", encoding =' +
			' "utf-8"), finally = {unlink("' + tempFile + '")});';

			sv.r.evalCallback(cmd, function(ret) {
				sv.cmdout.append(ret + "\n:>");
			});
		}
	} catch(e) {
		sv.log.exception(e, "Unknown error while sourcing R code in"
		+ " sv.r.source():\n\n (" + e + ")", true);
	}
	return(res);
}

// Send whole or a part of the current buffer to R and place cursor at next line
sv.r.send = function (what) {
	//sv.log.debug("sv.r.send " + what);
	var res = false;
	var view = ko.views.manager.currentView;
	if (!view) return(false); // No current view, do nothing!
	view.setFocus();
	var ke = view.scimoz;

	try {
		if (!what) what = "all"; // Default value

		var cmd = sv.getTextRange(what, what.indexOf("sel") == -1).rtrim();
		if (cmd) res = sv.rconn.eval(cmd);

		if (what == "line" || what == "linetoend") // || what == "para"
			ke.charRight();

	} catch(e) { return(e); }
	return(res);
}

// Get help in R (HTML format)
sv.r.help = function (topic, pkg) {
	var res = false;
	if (typeof(topic) == "undefined" || topic == "")
	topic = sv.getTextRange("word");

	if (topic == "")
	ko.statusBar.AddMessage(sv.translate("Selection is empty..."), "SciViews-K", 1000);

	if (topic || pkg) {
		var cmd = "";
		cmd += pkg ? ' package = "' + pkg + '", ' : "";
		cmd += topic ? ' topic = "' + topic + '", ' : "";
		cmd = 'cat(getHelpURL(help(' + cmd + ' help_type = "html")))';
		// Old version for R < 2.10:
		// cmd = 'cat(unclass(help(' + cmd + ' htmlhelp = TRUE)))';
		// TODO: error handling when package does not exists
		//res = sv.r.evalCallback(cmd, sv.command.openHelp);
		try {
			res = sv.rconn.evalAtOnce(cmd);
		} catch(e) {
			return false;
		}
		sv.command.openHelp(res);
		ko.statusBar.AddMessage(sv.translate("R help asked for \"%S\"", topic),
			"SciViews-K", 2000, false);
	}
	return res;
}

// Run the example for selected item
sv.r.example = function (topic) {
	var res = false;
	if (typeof(topic) == "undefined" | topic == "")
	topic = sv.getTextRange("word");
	if (topic == "") {
		ko.statusBar.AddMessage(sv.translate("Selection is empty..."),
		"SciViews-K", 1000, false);
	} else {
		res = sv.r.eval("example(" + topic + ")");
		ko.statusBar.AddMessage(sv.translate("R example run for \"%S\"", topic),
		"SciViews-K", 5000, true);
	}
	return res;
}

// Display some text from a file
sv.r.pager = function(file, title, cleanUp) {
	var rSearchUrl = "chrome://sciviewsk/content/rsearch.html";
	var content = sv.file.read(file);
	content = content.replace(/([\w\.\-]+)::([\w\.\-\[]+)/ig,
		'<a href="' + rSearchUrl + '?$1::$2">$1::$2</a>');
	content = "<pre id=\"rPagerTextContent\" title=\"" + title + "\">" +
		content + "</div>";
	//var charset = sv.socket.charset;
	sv.file.write(file, content, 'utf-8');
	sv.command.openHelp(rSearchUrl + "?file:" + file);
	if(cleanUp || cleanUp === undefined)
		window.setTimeout("try { sv.file.getfile('"+file+"').remove(false); } catch(e) {}", 10000);
}

// Search R help for topic
sv.r.search = function (topic, internal) {
	var res = false;
	if (!topic) {
		topic = sv.getTextRange("word");
		// Ask for the search string
		topic = ko.dialogs.prompt(sv.translate("Search R objects using a regular" +
		" expression (e.g. '^log' for objects starting with 'log')"),
		sv.translate("Pattern"), topic,
		sv.translate("Search R help"), "okRsearchPattern");
	}
	if (topic) {
		// Get list of matching items and evaluate it with sv.r.search_select()
		var cmd = 'cat(apropos("' + topic + '"), sep = "' + sv.r.sep + '")';
		res = sv.r.evalCallback(cmd, sv.r.search_select);
		ko.statusBar.AddMessage(sv.translate("Searching_R_help_for", topic),
		"SciViews-K", 5000, true);
	}
	return(res);
}

// The callback for sv.r.search
// TODO: make private
sv.r.search_select = function (topics) {
	if (topics.result !== undefined) topics = topics.result;

	ko.statusBar.AddMessage("", "SciViews-K");
	var res = false;
	if (sv.string.removeLastCRLF(topics) == "") {
		ko.statusBar.AddMessage(sv.translate("R help for %S not found.", topics),
		"SciViews-K");
	} else {	// Something is returned
		var items = topics.split(sv.r.sep);
		if (items.length == 1) {
			// Only one item, show help for it
			res = sv.r.help(sv.string.removeLastCRLF(topics));
		} else {
			// Select the item you want in the list
			var topic = ko.dialogs.selectFromList("R help topics",
			"Select a topic:", items, "one");
			if (topic != null)
			res = sv.r.help(sv.string.removeLastCRLF(topic.join("")));
		}
	}
	return(res);
}

// Search R web sites for topic
sv.r.siteSearch = function (topic, idxname) {
	var res = false;
	if (!topic) topic = sv.getTextRange("word");
	topic = topic.trim();

	if (!idxname) idxname = ["Rhelp08", "functions", "views"];
	else {
		var idxsep = "&idxname=";
		var idxnameAllow = ["Rhelp08", "Rhelp01", "Rhelp02", "functions",
			"views", "R-devel", "R-sig-mixed-models"];

		for (var i in idxname)
		if (idxnameAllow.indexOf(idxname[i]) == -1) idxname.splice(i, 1);
	}

	if (!topic) {
		ko.statusBar.AddMessage(sv.translate("Selection is empty..."),
		"SciViews-K", 1000, false);
		return;
	}

	idxname = idxsep + idxname.join(idxsep);

	// TODO: make it a pref
	var url = "http://search.r-project.org/cgi-bin/namazu.cgi?query=" + topic +
	"&max=20&result=normal&sort=score" + idxname;

	sv.command.openHelp(url);
}

// Save the content of the workspace in a file
sv.r.saveWorkspace = function (file, title) {
	// Ask for the filename if not provided
	if (typeof(file) == "undefined") {
		if (typeof(title) == "undefined") {
			title = 'Save the R workspace in a file';
		}
		file = ko.filepicker.saveFile("", ".RData", title);
		if (file == null) return;	// User clicked cancel
	}
	sv.r.eval('save.image("' + file + '")');
}

// Load the content of a .RData file into the workspace, or attach it
sv.r.loadWorkspace = function (file, attach, callback, param) {
	// Ask for the filename if not provided
	if (!file) {
		file = sv.fileOpen("", ".RData",
		sv.translate("Browse for R workspace file"),
		    [sv.translate("R workspace") + " (*.RData)|*.RData"], true);
	} else if (typeof file == "string") {
		file = file.split(/[;,]/);
	}
	if (!file || !file.length) return;

	var load = attach ? "attach" : "load";
	var cmd = [];
	for (var i in file)
	cmd[i] = load + "(\"" + (new String(file[i])).addslashes() + "\")";
	cmd = cmd.join("\n");
	// Note: callback is currently not available with the HTTP server!
	if (callback) {
		sv.r.evalCallback(cmd, callback, param);
	} else {
		sv.r.eval(cmd);
	}
}

// Save the history in a file
sv.r.saveHistory = function (file, title) {
	// Ask for the filename if not provided
	if (typeof(file) == "undefined") {
		if (typeof(title) == "undefined")
		title = 'Save the command history in a file';
		file = ko.filepicker.saveFile("", ".Rhistory", title);
		if (file == null) return;	// User clicked cancel
	}
	sv.r.eval('savehistory("' + file.addslashes() + '")');
}

// Load the history from a file
sv.r.loadHistory = function (file, title) {
	// Ask for the filename if not provided
	if (typeof(file) == "undefined") {
		if (typeof(title) == "undefined")
		title = 'Load the history from a file';
		file = ko.filepicker.openFile("", ".Rhistory", title);
		if (file == null) return;	// User clicked cancel
	}
	sv.r.eval('loadhistory("' + file.addslashes() + '")');
}

// There is also dev.copy2pdf() copy2eps() + savePlot windows
// and X11(type = "Cairo")
sv.r.saveGraph = function (type, file, title, height, width, method) {
	// Default values for the arguments
	if (type === undefined) type = "png256";
	if (height === undefined) height = 'dev.size()[2]';
	if (width === undefined) width = 'dev.size()[1]';
	if (method === undefined) method = "pdf";

	// Get the file extension according to type
	var ext = type.substring(0, 4);
	if (ext != "pgnm" & ext != "tiff" & ext != "jpeg") ext = ext.substring(0, 3);
	if (ext.substring(0, 2) == "ps") ext = "ps";
	if (ext == "jpeg") ext = "jpg";

	// Ask for the filename if not provided
	if (typeof(file) == "undefined") {
		if (typeof(title) == "undefined")
		title = 'Save the graph as "' + type + '"';
		file = ko.filepicker.saveFile("", "Rplot." + ext, title);
		if (file == null) return;	// User clicked cancel
	}
	// Save the current device in R using dev2bitmap()... needs gostscript!
	sv.r.eval('dev2bitmap("' + file.addslashes() + '", type = "' + type +
	'", height = ' + height + ', width = ' + width + ', method = "' +
	method + '")');
}

// Refresh MRU lists associated with the current session
sv.r.refreshSession = function () {
	var i;
	//// Refresh lists of dataset
	//var items = sv.file.list(sv.pref.getPref("sciviews.data.localdir"),
	//	/\.[cC][sS][vV]$/, true);
	////sv.prefs.mru("datafile", true, items);
	////ko.mru.reset("datafile_mru");
	////for (i = items.length - 1; i >= 0; i--) {
	////	if (items[i] != "")
	////	ko.mru.add("datafile_mru", items[i], true);
	////}
	//
	//// Refresh lists of scripts
	//items = sv.file.list(sv.pref.getPref("sciviews.scripts.localdir"),
	///\.[rR]$/, true);
	//sv.prefs.mru("scriptfile", true, items);
	//ko.mru.reset("scriptfile_mru");
	//for (i = items.length - 1; i >= 0; i--) {
	//	if (items[i] != "")
	//	ko.mru.add("scriptfile_mru", items[i], true);
	//}
	//
	//// Refresh lists of reports
	//items = sv.file.list(sv.pref.getPref("sciviews.reports.localdir"),
	///\.[oO][dD][tT]$/, true);
	//sv.prefs.mru("reportfile", true, items);
	//ko.mru.reset("reportfile_mru");
	//for (i = items.length - 1; i >= 0; i--) {
	//	if (items[i] != "")
	//	ko.mru.add("reportfile_mru", items[i], true);
	//}
}

// Initialize R session preferences in Komodo
// use sv.r.setSession() except at startup!
sv.r.initSession = function (dir, datadir, scriptdir, reportdir) {
	// Initialize the various arguments
	if (typeof(dir) == "undefined")
		dir = sv.pref.getPref("sciviews.session.dir", "~");
	if (typeof(datadir) == "undefined")
		datadir = sv.pref.getPref("sciviews.session.data", "");
	if (typeof(scriptdir) == "undefined")
		scriptdir = sv.pref.getPref("sciviews.session.scripts", "");
	if (typeof(reportdir) == "undefined")
		reportdir = sv.pref.getPref("sciviews.session.reports", "");

	var localdir = sv.file.path(dir);
	var sep = "/";

	// Refresh preferences
	var setPref = sv.pref.setPref;
	setPref("sciviews.session.dir", dir, true);
	setPref("sciviews.session.localdir", localdir, true);
	// Subdirectories for data, reports and scripts
	setPref("sciviews.session.data", datadir, true);
	setPref("sciviews.session.scripts", scriptdir, true);
	setPref("sciviews.session.reports", reportdir, true);
	// Combination of these to give access to respective dirs
	if (datadir == "") {
		setPref("sciviews.data.dir", dir, true);
		setPref("sciviews.data.localdir", localdir, true);
	} else {
		setPref("sciviews.data.dir", dir + sep + datadir, true);
		setPref("sciviews.data.localdir",
		sv.file.path(localdir, datadir), true);
	}
	if (scriptdir == "") {
		setPref("sciviews.scripts.dir", dir, true);
		setPref("sciviews.scripts.localdir", localdir, true);
	} else {
		setPref("sciviews.scripts.dir", dir + sep + scriptdir, true);
		setPref("sciviews.scripts.localdir",
		sv.file.path(localdir, scriptdir), true);
	}
	if (reportdir == "") {
		setPref("sciviews.reports.dir", dir, true);
		setPref("sciviews.reports.localdir", localdir, true);
	} else {
		setPref("sciviews.reports.dir", dir + sep + reportdir, true);
		setPref("sciviews.reports.localdir",
		sv.file.path(localdir, reportdir), true);
	}

	var DIRECTORY_TYPE = Components.interfaces.nsIFile.DIRECTORY_TYPE;

	// Look if the session directory exists, or create it
	var file = sv.file.getfile(localdir);

	if (!file || !file.exists() || !file.isDirectory()) {
		sv.log.debug( "Creating session directory... " );
		try {
			file.create(DIRECTORY_TYPE, 511);
		} catch(e) {
			// XXX
			sv.log.warn("sv.r.initSession: " + e + "\nfile.create " + file.path);
		}

	}
	// ... also make sure that Data, Script and Report subdirs exist
	var subdirs = [datadir, scriptdir, reportdir];
    for (var i in subdirs) {
		if (subdirs[i] != "") {
            var file = sv.file.getfile(sv.file.path(dir, subdirs[i]));
            // TODO: check for error and issue a message if the file is not a dir
			if (!file.exists() || !file.isDirectory())
			file.create(DIRECTORY_TYPE, 511);
            delete(file);
        }
	}
	// refresh lists of data, scripts and reports found in the session
	sv.r.refreshSession();
	return(dir);
}

//TODO: Allow also for dirs outside Home directory (useful on windows)
// Set a R session dir and corresponding dir preferences both in R and Komodo
sv.r.setSession = function (dir, datadir, scriptdir, reportdir, saveOld, loadNew) {
	// Set defaults for saveOld and loadNew
	if (saveOld === undefined) saveOld = true;
	if (loadNew === undefined) loadNew = true;

	// cmd is the command executed in R to switch session (done asynchronously)
	var cmd = [];

	// If dir is the same as current session dir, do nothing
	if (typeof(dir) != "undefined" && sv.file.path(dir) ==
		sv.file.path(sv.pref.getPref("sciviews.session.dir", "")))
		return(false);

	// Before switching to the new session directory, close current one
	// if R is running
	if (saveOld) {
		// Save .RData & .Rhistory in the the session directory and clean WS
		// We need also to restore .required variable (only if it exists)
		cmd.push('if (exists(".required")) assignTemp(".required", .required)',
				 'if(existsTemp(".Last.sys", "function")) do.call(".Last.sys", list(), envir = TempEnv())',
				 'save.image(); savehistory()',
				 'rm(list = ls())');
	}
	cmd.push('.required <- getTemp(".required")');

	// Initialize the session
	dir = sv.r.initSession(dir, datadir, scriptdir, reportdir);

	// Switch to the new session directory in R
	cmd.push('setwd("' + dir.addslashes() + '")\noptions(R.initdir = "' +
		dir.addslashes() + '")');

	var svFile = sv.file;

	// Do we load .RData and .Rhistory?
	// TODO: loadhistory APPENDS a history. Make R clear the current history first.
	// Note: there seems to be no way to clear history without restarting R!
	if (loadNew) {
		cmd.push('sys.load.image(".RData", FALSE)',
				 'if (file.exists(".Rhistory")) loadhistory()');

		// Look for .Rprofile, in current, then in user directory (where else R looks for it?)
		// if exists, source the first one.
		var Rprofile = [
			svFile.path(sv.pref.getPref("sciviews.session.dir", "~"), ".Rprofile"),
			svFile.path("~", ".Rprofile")
		]

		for(i in Rprofile) {
			if(svFile.exists(Rprofile[i])) {
				cmd.push('source("' + (Rprofile[i]).addslashes() + '")');
				break;
			}
		}
	}

	//sv.cmdout.append(cmd.join(";\n"));

	// Execute the command in R (TODO: check for possible error here!)
	// TODO: run first in R; make dirs in R; then change in Komodo!
	sv.r.evalCallback(cmd.join(";\n"), function(data) {
		sv.cmdout.append(data);

	// Indicate everything is fine
		ko.statusBar.AddMessage(sv.translate("R session directory set to '%S'", dir),
		"SciViews-K", 20000, true);
		// Break possible partial multiline command in R from previous session
		// and indicate that we are in a new session now in the R console
		// TODO: Breaking should be done *before* the last command
		// TODO: report if we load something or not
		sv.r.evalCallback('cat("Session directory is now", dQuote("' + dir.addslashes() +
			'"), "\\n", file = stderr())', null);
		// Refresh object explorer, ...
		//sv.rconn.eval('koCmd("sv.rbrowser.smartRefresh()")', null, true);
		sv.rbrowser.smartRefresh();
	});
	return(true);
}

// Switch to another R session (create it if it does not exists yet)
sv.r.switchSession = function (inDoc) {
	var baseDir = "";
	var sessionDir = "";
	// Base directory is different on Linux/Mac OS X and Windows
	if (navigator.platform.indexOf("Win") == 0) {
		baseDir = "~";
	} else {
		baseDir = "~/Documents";
	}
	if (inDoc) {
		// Ask for the session subdirectory
		var Session = "SciViews R Session"
		Session = ko.dialogs.prompt(sv.translate("Session in my documents " +
		"(use '/' for subdirs, like in 'dir/session')"),
		sv.translate("Session"), Session,
		sv.translate("Switch to R session"), "okRsession");
		if (Session != null & Session != "") {
			// Make sure that Session does not start with /, or ./, or ../
			Session = Session.replace(/\^.{0,2}\//, "");
			// Construct session dir
			sessionDir = baseDir + "/" + Session;
		} else sessionDir = "";
	} else {
		// Ask for the session path
		sessionDir = ko.filepicker
		.getFolder(baseDir, sv.translate("Choose session directory"));
	}
	if (sessionDir != null & sessionDir != "") {
		// Subdirectories for data, scripts and reports
		var datadir = "";
		var scriptdir = "";
		var reportdir = "";
		var cfg = "";
		var cfgfile = sv.file.path(sessionDir, ".svData");
		var filefound = false;
		// Look if this directory already exists and contains a .svData file
		if (sv.file.exists(sessionDir) == 2 &
		sv.file.exists(cfgfile) == 1) {
			// Try reading .svData file
			try {
				cfg = sv.file.read(cfgfile, "utf-8");
				filefound = true;
				// Actualize values for datadir, scriptdir and reportdir
				cfg = cfg.split("\n");
				var key, value;
				for (i in cfg) {
					key = cfg[i].split("=");
					if (key[0].trim() == "datadir") datadir = key[1].trim();
					if (key[0].trim() == "scriptdir") scriptdir = key[1].trim();
					if (key[0].trim() == "reportdir") reportdir = key[1].trim();
				}
			} catch (e) { }
		}
		// If no .svData file found, ask for respective directories
		if (!filefound) {
			datadir = ko.dialogs.prompt(
			sv.translate("Subdirectory for datasets (nothing for none):"),
			"", "data", sv.translate("R session configuration"), "okRsesData");
			if (datadir == null) return(false);
			scriptdir = ko.dialogs.prompt(
			sv.translate("Subdirectory for R scripts (nothing for none):"),
			"", "R", sv.translate("R session configuration"), "okRsesScript");
			if (scriptdir == null) return(false);
			reportdir = ko.dialogs.prompt(
			sv.translate("Subdirectory for reports (nothing for none):"),
			"", "doc", sv.translate("R session configuration"), "okRsesReport");
			if (reportdir == null) return(false);
		}
		// Now create or switch to this session directory
		sv.r.setSession(sessionDir, datadir, scriptdir, reportdir);
		// If there were no .svData file, create it now
		if (!filefound) {
			// Save these informations to the .svData file in the session dir
			sv.file.write(cfgfile, "datadir=" + datadir + "\nscriptdir=" +
			scriptdir + "\nreportdir=" + reportdir, "utf-8", false);
		}
		return(true);
	}
	return(false);
}

// Reload .RData and .Rhistory files from session directory
sv.r.reloadSession = function () {
	// Ask for confirmation first
	if (ko.dialogs.okCancel("Are you sure you want to delete all objects " +
	"and reload them from disk?", "OK", "You are about to delete all " +
	"objects currently in R memory, and reload the initial content from " +
	"disk (.RData and .Rhistory files)...", "Reload session") == "OK") {
		// Switch temporarily to the session directory and try loading
		// .RData and Rhistory files
		var dir = sv.pref.getPref("sciviews.session.dir", "");
		var cmd = 'rm(list = ls(pattern = "[.]active[.]", all.names = TRUE))\n' +
			'rm(list = ls()); .savdir. <- setwd("' + dir + '")\n' +
			'if (file.exists(".RData")) load(".RData")\n' +
			'if (file.exists(".Rhistory")) loadhistory()\n' +
			'setwd(.savdir.); rm(.savdir.)\n';
		sv.r.evalHidden(cmd);
	}
}

// Clear .RData and .Rhistory files from session directory
sv.r.clearSession = function () {
	// Ask for confirmation first
	if (ko.dialogs.okCancel("Are you sure you want to delete .RData and " +
	".Rhistory files from disk?", "OK", "You are about to delete the data" +
	" saved in .RData and the command history saved in .Rhistory for the " +
	"current session...", "Clear session") == "OK") {
		// Delete .RData and Rhistory files
		var dir = sv.pref.getPref("sciviews.session.dir", "");
		var cmd = '.savdir. <- setwd("' + dir + '")\n' +
		'unlink(".RData"); unlink(".Rhistory")\n' +
		'setwd(.savdir.); rm(.savdir.)';
		sv.r.evalHidden(cmd);
	}
}

// Quit R (ask to save in save in not defined)
sv.r.quit = function (save) {
	if (typeof(save) == "undefined") {
		// Ask for saving or not
		var response = ko.dialogs.customButtons("Do you want to save the" +
		" workspace (.RData) and the command history (.Rhistory) in" +
		" the session directory first?", ["Yes", "No", "Cancel"], "No",
		null, "Exiting R");
		if (response == "Cancel") return;
	} else response = save ? "yes" : "no";
	// Quit R
	// PhG: in R 2.11, R.app 1.33 q() is not usable any more... one has to
	// be more explicit with base::q()
	sv.r.evalHidden('base::q("' + response.toLowerCase() + '")');
	// Clear the R-relative statusbar message
	ko.statusBar.AddMessage("", "SciViews-K");
	// Clear the objects browser
	sv.rbrowser.clearPackageList();
	setTimeout(function() sv.command.updateRStatus(sv.rconn.testRAvailability()),
		1000);
}

//// Define the 'sv.r.pkg' namespace ///////////////////////////////////////////
if (typeof(sv.r.pkg) == 'undefined') sv.r.pkg = new Object();

// Select repositories
// TODO: a Komodo version of this that returns pure R code
sv.r.pkg.repositories = function () {
	var res = sv.r.eval('setRepositories(TRUE)');
	return res;
	//on Linux, try reading data from: "<HOME>/.R/repositories", "/usr/lib/R/etc/repositories", "usr/local/lib/R/etc/repositories"
	//on Windows, "<HOME>/.R/repositories", "<R_installPath>/etc/repositories"
}

// Select CRAN mirror
sv.r.pkg.chooseCRANMirror = function (setPref) {
	var res = false;
	var cmd = 'assignTemp("cranMirrors", getCRANmirrors(all = FALSE, local.only = FALSE));' +
	'write.table(getTemp("cranMirrors")[, c("Name", "URL")], col.names = FALSE, quote = FALSE, sep ="' +
	sv.r.sep + '", row.names = FALSE)';

	try {
		var reposList = sv.rconn.evalAtOnce(cmd, 1);
	} catch(e) {
		return '';
	}

	if (!reposList.trim()) {
		sv.alert("Error getting CRAN Mirrors list.");
		return '';
	}

	var reposList = reposList.split(/[\n\r]+/);
	var names = [], urls = [];
	for (i in reposList) {
		var m = reposList[i].split(sv.r.sep);
		names.push(m[0]);
		urls.push(m[1]);
	}

	var items = ko.dialogs.selectFromList(sv.translate("CRAN mirrors"),
		sv.translate("Select CRAN mirror to use:"), names, "one");

	if(!items) return null;

	repos = urls[names.indexOf(items[0])].replace(/\/$/, "");

	cmd = 'with(TempEnv(), {repos <- getOption("repos");' +
		'repos["CRAN"] <- "' + repos + '"; ' + 'options(repos = repos)})';
	sv.rconn.eval(cmd, null, true);
	if (setPref) sv.pref.setPref("CRANMirror", repos);

	return(repos);
}

// List available packages on the selected repositories
sv.r.pkg.available = function () {
	var res = sv.r.eval('.pkgAvailable <- available.packages()\n' +
		'as.character(.pkgAvailable[, "Package"])');
	ko.statusBar.AddMessage(sv.translate(
		"Looking for available R packages... please wait"),
		"SciViews-K", 5000, true);
	return(res);
}

// List installed packages
sv.r.pkg.installed = function () {
	var res = sv.r.eval('.pkgInstalled <- installed.packages()\n' +
	'as.character(.pkgInstalled[, "Package"])');
	ko.statusBar.AddMessage(sv.translate(
	"Looking for installed R packages... please wait"),
	"SciViews-K", 5000, true);
	return(res);
}

// List new packages in the repositories
sv.r.pkg.new = function () {
	var res = sv.r.eval('(.pkgNew <- new.packages())');
	ko.statusBar.AddMessage(sv.translate(
	"Looking for new R packages... please wait"), "SciViews-K", 5000, true);
	return(res);
}

// List installed packages which are older than those in repository (+ versions)
sv.r.pkg.old = function () {
	var res = sv.r.eval('.pkgOld <- old.packages()\n' +
	'if (is.null(.pkgOld)) cat("none!\n") else\n    noquote(.pkgOld[, c("Installed", "ReposVer")])');
	ko.statusBar.AddMessage(sv.translate(
	"Looking for old R packages... please wait"), "SciViews-K", 5000, true);
	return(res);
}

// Update installed packages
sv.r.pkg.update = function () {
	var res = sv.r.eval('update.packages(ask = "graphics")');
	ko.statusBar.AddMessage(sv.translate(
	"Updating R packages... please wait"), "SciViews-K", 5000, true);
	return(res);
}

// Some statistics about R packages
sv.r.pkg.status = function () {
	var res = sv.r.eval('(.pkgStatus <- packageStatus())');
	ko.statusBar.AddMessage(sv.translate(
	"Compiling R packages status... please wait"), "SciViews-K", 5000, true);
	return(res);
}

// Which R packages are currently loaded?
sv.r.pkg.loaded = function () {
	var res = sv.r.eval('(.packages())');
	return(res);
}

// Load one R package
sv.r.pkg.load = function () {
	var res = false;
	ko.statusBar.AddMessage(sv.translate("ListingPackages"),
	"SciViews-K", 20000, true);

	// Get list of installed R packages that are not loaded yet
	res = sv.r.evalCallback('.tmp <- .packages(all.available = TRUE);' +
	'cat(.tmp[!.tmp %in% .packages()], sep = "' + sv.r.sep + '"); rm(.tmp)',
	function (pkgs) {
		ko.statusBar.AddMessage("", "SciViews-K");
		var res = false;
		if (pkgs.trim() == "") {
			sv.alert("All installed R packages seem to be already loaded!");
		} else {	// Something is returned
			var items = pkgs.split(sv.r.sep);
			// Select the item you want in the list
			var topic = ko.dialogs.selectFromList(
			sv.translate("Load R package"),
			sv.translate("Select R package(s) to load") + ":", items);
			if (topic != null) {
				// TODO: make a R function in svMisc instead!
				res = sv.r.evalCallback('cat(paste(lapply(c("' +
				topic.join('", "') + '"), function(pkg) { res <- try('
				+ 'library(package = pkg, character.only = TRUE)); ' +
				'paste("Package", sQuote(pkg), if (inherits(res,' +
				' "try-error")) "could not be loaded" else "loaded")' +
				'}), collapse = "\\n"), "\\n")', sv.cmdout.append);
			}
		}
		return(res);
	});
	return(res);
}

// Unload one R package
sv.r.pkg.unload = function () {
	var res = false;
	// Get list of loaded packages, minus required ones we cannot unload
	var cmd = '.tmp <- .packages(); cat(.tmp[!.tmp %in%' +
	' c(if (exists(".required")) .required else NULL, "base")],' +
	' sep = "' + sv.r.sep + '"); rm(.tmp)';
	res = sv.r.evalCallback(cmd, sv.r.pkg.unload_select);
	ko.statusBar.AddMessage(sv.translate(
	"Listing loaded R packages... please wait"), "SciViews-K", 20000, true);
	return(res);
}

// The callback for sv.r.pkg.unload
// TODO: make private
sv.r.pkg.unload_select = function (pkgs) {
	ko.statusBar.AddMessage("", "SciViews-K");
	var res = false;
	if (sv.string.removeLastCRLF(pkgs) == "") {
		sv.alert("None of the loaded packages are safe to unload!");
	} else {	// Something is returned
		var items = pkgs.split(sv.r.sep);
		// Select the item you want in the list
		var topic = ko.dialogs.selectFromList("Unload R package",
		"Select one R package to unload:", items, "one");
		if (topic != null)
		res = sv.r.eval("detach(\"package:" + topic[0].trim()+ "\", unload = TRUE)");
	}
	return(res);
}

// Remove one R package
sv.r.pkg.remove = function () {
	var res = false;
	// Get list of all packages, minus required/recommended we cannot remove
	var cmd = '.tmp <- installed.packages(); ' +
	'.tmp <- rownames(.tmp)[is.na(.tmp[, "Priority"])]; ' +
	'cat(.tmp[!.tmp %in% c(if (exists(".required")) .required else NULL,' +
	' "svMisc", "svIDE", "svGUI", "svSocket", "svIO", "svViews",' +
	' "svWidgets", "svDialogs")], sep = "' + sv.r.sep + '"); rm(.tmp)';
	res = sv.r.evalCallback(cmd, sv.r.pkg.remove_select);
	ko.statusBar.AddMessage(sv.translate(
	"Listing removable R packages... please wait"), "SciViews-K", 20000, true);
	return(res);
}

// The callback for sv.r.pkg.remove
sv.r.pkg.remove_select = function (pkgs) {
	ko.statusBar.AddMessage("", "SciViews-K");
	var res = false;
	if (sv.string.removeLastCRLF(pkgs) == "") {
		sv.alert(sv.translate("None of the installed R packages are safe to remove!"));
	} else {	// Something is returned
		var items = pkgs.split(sv.r.sep);
		// Select the item you want in the list
		var topic = ko.dialogs.selectFromList("Remove R package",
		"Select one R package to remove:", items, "one");
		if (topic != null) {
			var pkg = (sv.string.removeLastCRLF(topic.join('')));
			var response = ko.dialogs.customButtons(
			"You are about to remove the '" + pkg +
			"' R package from disk! Are you sure?",
				["&Continue...", "Cancel"], "Continue...", null,
			"Removing an R package");
			if (response == "Cancel") return(res);

			res = sv.r.eval('remove.packages("' + pkg +
			'", lib = installed.packages()["' + pkg + '", "LibPath"])');
		}
	}
	return(res);
}

// sv.r.pkg.install - install R packages
// examples:
// sv.r.pkg.install() // use default CRAN mirror
// sv.r.pkg.install("", true) // re-set CRAN mirror
// sv.r.pkg.install(["boot", "lme4"])
// sv.r.pkg.install("", "local") // local installation, popups "Open file" dialog
// sv.r.pkg.install("/path/to/packages", "local") // with initial path
// sv.r.pkg.install("sciviews") // install all sciViews packages
// sv.r.pkg.install("sciviews", "r-forge") // ... from R-Forge
// sv.r.pkg.install("sciviews", "http://r.meteo.uni.wroc.pl") // use different CRAN mirror

sv.r.pkg.install = function (pkgs, repos) {
	var reset = false;
	if (repos === true) {
		reset = true;
		repos = undefined;
	}

	if (repos === undefined) {
		var defaultRepos = sv.pref.getPref("CRANMirror");
		if (reset || !defaultRepos || defaultRepos == "None") {
			repos = sv.r.pkg.chooseCRANMirror();
			if (!repos) return;
		} else
			repos = defaultRepos;
	} else if (repos === false) {
		try {
			repos = sv.rconn.evalAtOnce("cat(getOption(\"repos\")[\"CRAN\"])").trim();
		} catch(e) {
			return;
		}
		if (repos == "@CRAN@") return;
	}

	// At this point repos should be always set
	sv.cmdout.append(sv.translate("Using repository at %S", repos));
	repos = repos.toLowerCase();

	var startDir = null;

	// TODO: allow for array of package files
	if (typeof(pkgs) == "string" && sv.file.exists(pkgs) == sv.file.TYPE_DIRECTORY) {
		repos = "local";
		startDir = pkgs;
	}

	// no packages provided, popup a list with available ones then callback again
	if (!pkgs && repos != "local") {
		ko.statusBar.AddMessage(sv.translate("Listing available packages..."),
		"SciViews-K", 5000, true);

		try {
			pkgs = sv.rconn.evalAtOnce(
				'cat(tryCatch(available.packages(contriburl=contrib.url("'
				+ repos +
				'", getOption("pkgType")))[,1],warning=function(e)e$message), sep="' +
				sv.r.sep + '")', 5).trim();
		} catch(e) {
			return;
		}

		pkgs = pkgs.split(sv.r.sep);
		if (pkgs.length < 3) {
			ko.dialogs.alert('Listing available packages, R said:', pkgs.join(''), 'SciViews-K');
			return;
		}
		// Case insensitive sorting:
		pkgs.sort(function(a,b) a.toUpperCase() > b.toUpperCase());

		pkgs = ko.dialogs.selectFromList(
			sv.translate("Install R package"),
			sv.translate("Select package(s) to install") + ":", pkgs);
		if (pkgs == null) return;
	}

	// Expand short names
	if (repos == "r-forge") {
		repos = "http://r-forge.r-project.org";
	} else if (repos == "local") {
		repos = "NULL";

		if (!pkgs || startDir) {
			// Get list of files to install
			pkgs = sv.fileOpen(startDir, null,
			sv.translate("Select package(s) to install"),
				['Zip archive (*.zip)|*.zip', 'Gzip archive (*.tgz;*.tar.gz)|*.tgz;*.tar.gz'], true);

			if (pkgs == null) return;

			for (i in pkgs) pkgs[i] = pkgs[i].addslashes();
		}
	}

	if (repos != "NULL") repos = "\"" + repos + "\"";

	if (typeof(pkgs) == "string") {
		if (pkgs.toLowerCase() == "sciviews") {
			pkgs = ["SciViews", "svMisc", "svSocket", "svGUI", "svIDE",
				"svDialogs", "svWidgets", "svSweave", "svTools", "svUnit", "tcltk2"];
		} else {
			pkgs = [pkgs];
		}
	}

	var cmd = "install.packages(c(\"" + pkgs.join('", "') + "\"), repos = " +
	repos + ")";
	//sv.cmdout.append(cmd);
	sv.r.eval(cmd);
}

// Initialize the default (last used) R session
sv.r.initSession();

/////////////////////////////
sv.r.saveDataFrame = function _saveDataFrame(name, fileName, objName, dec, sep) {
	if (!dec) dec = sv.pref.getPref("r.csv.dec");
	if (!sep) sep = sv.pref.getPref("r.csv.sep");

	if (!fileName) {
		var filterIndex;
		switch(sep) {
			case '\\t':
			filterIndex = 1;
			break;
			case ';':
			case ',':
			filterIndex = 0;
			break;
			case ' ':
			filterIndex = 2;
			break;
			default:
			filterIndex = 3;
		}

		var dir = sv.pref.getPref("sciviews.session.dir");

		oFilterIdx = {value : filterIndex};
		fileName = sv.fileOpen(dir, objName, "",
			["Comma separated values (*.csv)|*.csv",
			"Tab delimited (*.txt)|*.txt",
			"Whitespace delimited values (*.txt)|*.txt"
			], false, true, oFilterIdx);
		sep = [",", "\\t", " "][oFilterIdx.value];
		if (dec == "," && sep == ",") dec = ";";
	}

	var cmd = 'write.table(' + name + ', file="' +
	sv.string.addslashes(fileName) +
	'", dec="' + dec + '", sep="' + sep + '", col.names=NA)';
	sv.r.eval(cmd);
	return(cmd);
}

// Temporary code - for memory only
//sv.r.RinterpreterTrial = function (code) {
//	var R = Components
//		.classes["@sciviews.org/svRinterpreter;1"]
//		.getService(Components.interfaces.svIRinterpreter);
//
//	return R.calltip(code);
//}

// Detect where R is located now...
//sv.r.application(true); // Warn if not found!
