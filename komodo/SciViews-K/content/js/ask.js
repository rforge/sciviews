// SciViews-K ask interpolation query code ('sv.ask' namespace)
// Define functions useful in the context of interpolation query dialog box
// Copyright (c) 2010, Ph. Grosjean (phgrosjean@sciviews.org)
// License: MPL 1.1/GPL 2.0/LGPL 2.1
////////////////////////////////////////////////////////////////////////////////
// sv.ask.setDefault(object, classes); // Set default object for those class(es)
// sv.ask.vars(object, restrict);      // List all numeric variables for object
// sv.ask.factors(object, restrict);   // List all factor variables for object
//
////////////////////////////////////////////////////////////////////////////////
// TODO: list files in a directory and a given extension


if (typeof(sv.ask) == 'undefined') sv.ask = new Object();

// Set default object for the given class(es)
sv.ask.setDefault = function (object, classes) {
	// If classes is provided, set corresponding preferences
	// Otherwise, ask R for the classes (also look if it is data.frame or lm)!
	var cls, i;
	switch (arguments.length) {
	case  1:
		// No class provided => send code to R to set it according to the
		// actual class of the object
		res = sv.r.evalCallback('if (exists("' + object + '")) ' +
			'cat(c("' + object + '", class(' + object + ')), sep = "|")',
			function (message) {
				var cls = sv.tools.strings.removeLastCRLF(message).split("|");
				var obj = cls[0];
				for (i = 1; i < cls.length; i++) {
					if (cls[i] != null & cls[i] != "") {
						sv.prefs.setString("r.active." + cls[i], obj, true);
						if (cls[i] == "data.frame") {
							sv.prefs.setString("r.active.data.frame.d", obj +
								"$", true);
							sv.r.obj_message();
						} else if (cls[i] == "lm") sv.r.obj_message();
					}
				}
			}
		);
		break;
	
	case 2:
		// Classes are provided (separated by |)
		cls = classes.split("|");
		for (i = 0; i < cls.length; i++) {
			if (cls[i] != null & cls[i] != "") {
				sv.prefs.setString("r.active." + cls[i], object, true);
				if (cls[i] == "data.frame") {
					sv.prefs.setString("r.active.data.frame.d", object + "$", true);
					sv.r.obj_message();
				} else if (cls[i] == "lm") sv.r.obj_message();
			}
		}
	}
}

// List all numeric variables for object
sv.ask.vars = function (object, restrict) {
	// TODO...
}

// List all factor variables for object
sv.ask.factors = function (object, restrict) {
	// TODO...
}