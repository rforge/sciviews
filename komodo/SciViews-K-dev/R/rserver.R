#
# Simple communication between R and a client through a socket connection
# (c) 2011 Kamil Barton
#
# Files: 'rserver.R' 'rserver.tcl' 'sv_captureAll.R' (or package svMisc)
# Result is evaluated in R and sent back in JSON format
# Client should format the data in a following way:
# - escape newline, carriage returns, formfeeds and backslashes with a backslash
# - if the first character is ASCII #1, then the next character is interpreted
#   as evaluation mode specifier [currently mode is ignored].
# - command ends with a newline.
# Old format ("<<<xxx>>>>" marks) is also accepted, but ignored.
# The result returned is an object with two components "result" and "message".
# The "message" can be one of: "Want more" (incomplete code, waiting for
# continuation), "Parse error" or "Done".
# In the "result", element 'stdout' and 'stdin' streams are delimited by ASCII
# 03 and 02.
#
# Multiple servers can be started (on different ports), and each can
# simultanously accept multiple connections.
# The connection can be permanent.
# TODO: how to send user interrupt?

# the (faster?) alternative would be 'json.method' = "tcl", but it is faulty
# currently.
options(json.method = "R")

require(tcltk)

# 'imports'
.Tcl <- tcltk::.Tcl
tcl <- tcltk::tcl
.Tcl.callback <- tcltk::.Tcl.callback
###

# # Example: make a R function return a value in Tcl:
# # first, R function should set assign the result to some Tcl value
# .Tcl("set retval") # <- retval is set locally within the function scope
# funTest <- function(x) tcl("set", "retval", round(runif(as.numeric(x)), 3))
# # then, include it the 'retval' argument
# tclfun(funTest, retval="retval")
# .Tcl("funTest 5")
`tclfun` <- function(f, fname = deparse(substitute(f)), retval = NA,
					 body = "%s") {
	cmd <- .Tcl.callback(f)
	if (is.character(retval))
		body <- paste("%s; return $", retval, sep = "")
	cmd2 <- sprintf(paste("proc %s {%s} {", body, "}"),
		fname,
		paste(names(formals(f)), collapse = " "),
		gsub("%", "$", cmd, fixed = TRUE))
	.Tcl(cmd2)
	cmd2
}

#-------------------------------------------------------------------------------


`TempEnv` <- function() {
	srch <- search()
    if (is.na(match("SciViews:TempEnv", srch)))
        attach(NULL, name = "SciViews:TempEnv", pos = length(srch) - 1L)
    as.environment("SciViews:TempEnv")
}

`assignTemp` <- function (x, value, replace.existing = TRUE)
    if (replace.existing || !exists(x, envir = TempEnv(), mode = "any",
		inherits = FALSE))
        assign(x, value, envir = TempEnv())

`existsTemp` <- function (x, mode = "any")
    exists(x, envir = TempEnv(), mode = mode, inherits = FALSE)


`getTemp` <- function (x, default = NULL, mode = "any", item = NULL) {
    if (is.null(item))
		Mode <- mode else
		Mode <- "any"
    if  (exists(x, envir = TempEnv(), mode = Mode, inherits = FALSE)) {
        dat <- get(x, envir = TempEnv(), mode = Mode, inherits = FALSE)
        if (is.null(item)) return(dat) else {
            item <- as.character(item)[1]
            if (inherits(dat, "list") && item %in% names(dat)) {
                dat <- dat[[item]]
                if (mode != "any" && mode(dat) != mode) dat <- default
                return(dat)
            } else {
				return(default)
            }
        }
    } else { # Variable not found, return the default value
        return(default)
    }
}

#-------------------------------------------------------------------------------
`TclReval` <- function(x, id, mode) {

	#command format "\x01.[eHhuQq][<uid>][ESC] code to be evaluated....\r\n"
	## DEBUG
	#cl <- match.call()
	#cl[[1]] <- as.name("TclReval")
	#cl <- deparse(cl)
	#Encoding(cl) <- "UTF-8"
	#cat(cl, "\n")
	## DEBUG

	if (x != "") {
		Encoding(x) <- "UTF-8"
		# This is now done by Tcl (DoServe)
		#if(substr(x, 1L, 1L) == '\x01') {
			#xmode <- substr(x, 2L, 2L)
		#	x <- substr(x, 3L, nchar(x))
		#} else {
		#	x <- gsub("^((<<<[\\w=]+>>>)+)", "", x, perl=TRUE) # TODO: mode handling
		#	x <- gsub("<<<n>>>", "\n", x, fixed=TRUE)
		#	xmode <- 'e'
		#}

		prevcodeVarName <- paste("part", id, sep=".")
		.tempEnv <- TempEnv()

		prevcode <- if(exists(prevcodeVarName, .tempEnv, inherits = FALSE))
			get(prevcodeVarName, .tempEnv, inherits = FALSE) else NULL

		# check for ESCape character at the beginning. If one, break multiline
		if(substr(x, 1L, 1L) == "\x1b") {
			x <- substr(x, 2L, nchar(x))
			prevcode <- NULL
		}

		if (mode != "h") cat(":> ", c(prevcode, x), "\n") # if mode in [e,u]

		expr <- parseText(c(prevcode, x))

		if(!is.expression(expr) && is.na(expr)) {
			ret <- ''
			msg <- 'Want more'
			assign(prevcodeVarName, c(prevcode, x), .tempEnv)
		} else {
			if(inherits(expr, "try-error")) {
				ret <- c('\x03', c(expr), '\x02')
				msg <- 'Parse error'
			} else {
				ret <- sv_captureAll(expr, markStdErr = TRUE)
				#browser()
				#ret <- eval(call("sv_captureAll", expr, markStdErr=TRUE), envir=.GlobalEnv)
				msg <- 'Done'
				# TODO: later
				#lapply(unlist(strsplit(c(prevcode, x), "(\r?\n|\r)")), function(entry)
				#	.Internal(addhistory(entry)))
			}

			if(exists(prevcodeVarName, .tempEnv, inherits = FALSE))
				rm(list = prevcodeVarName, envir = .tempEnv)
		}
		###########


		if (identical(getOption("json.method"), "R")) {
			tcl("set", "retval", simpsON(list(result = c(ret), message = msg)))
		} else {
			tcl(if(length(ret) == 1) "lappend" else "set", "result", ret)
			.Tcl("set result {}")
			.Tcl("set retval [dict create]")
			.Tcl("dict set retval result $result")
			tcl("dict", "set", "retval", "message", msg)
			.Tcl("set retval [compile_json {dict result list message string} $retval]")
		}
	} else {
		tcl("set", "retval", "") # is set in the function scope
	}
}

#-------------------------------------------------------------------------------

`enumServers` <-
function() as.character(.Tcl("array names Rserver::Server"))

#-------------------------------------------------------------------------------

`TclRprint` <- function(x, debug = 0) {
	if(debug < getOption('warn')) {
		Encoding(x) <- "UTF-8"
		cat(sprintf("[[ %s ]]", x), "\n")
	}
	invisible(x)
}
#-------------------------------------------------------------------------------

`sv_startServer` <-
function(port) tcl("Rserver::Start", port)

`listServers` <-
function() as.numeric(.Tcl("array names Rserver::Server"))

`stopAllServers` <- function() {
	num <- as.numeric(.Tcl("array size Rserver::Server"))
	.Tcl('foreach {name} [array names Rserver::Server] { Rserver::Stop $name }')
	return(num)
}

`listConnections` <-
function() as.character(.Tcl("array names Rserver::Connection"))

`stopAllConnections` <- function() {
	num <- as.numeric(.Tcl("array size Rserver::Connection"))
	.Tcl('Rserver::CloseAllConnections')
	return(num)
}

#`koCmd` <- function (cmd, data = NULL, async = FALSE,
#					 host = getOption("ko.host"),
#					 port = getOption("ko.port"),
#					 timeout = 1,	# not really used
#					 ...) {
#
#	if(!is.numeric(port)) stop("Invalid port: ", port)
#
#    #type <- match.arg(type)
#	conn <- .Tcl(sprintf("set ko_Conn1 [::Rclient::Start %d {%s} %d]", port,
#						 host, timeout))
#	if(as.character(conn) == "-1") {
#		warning("timeout")
#		return(NULL)
#	}
#	res <- as.character(.Tcl(sprintf("Rclient::Ask {%s} $ko_Conn1 {%s}", cmd,
#									 "<<<js>>>")))
#	.Tcl("close $ko_Conn1")
#	res
#}

# from svGUI::koCmd (modified)
`koCmd` <- function (cmd, data = NULL, async = FALSE, # 'data' is not used
				   host = getOption("ko.host"),
				   port = getOption("ko.port"),
				   timeout = 1,
				   #type = c("js", "rjsonp", "output"), # type is always 'js'
				   ...)
{
	if(!is.numeric(port)) stop("Invalid port: ", port)


    cmd <- paste(gsub("\f", "\\f", gsub("\r", "\\r", gsub("\n", "\\n",
				gsub("\\", "\\\\", cmd, fixed = TRUE), fixed = TRUE),
				fixed = TRUE), fixed = TRUE),
				collapse = "\\n")

	#set command [string map [list "\\" {\\} "\n" {\n} "\r" {\r} "\f" {\f}] $command]
    prevopt <- options(timeout = max(1, floor(timeout)))

	tryCatch(con <- socketConnection(host = host, port = port, blocking = !async),
		warning = function(e) stop(simpleError(paste("timeout on ", host, ":",
													 port, sep = ""))))

    writeLines(paste("<<<js>>>", cmd, sep = ""), con)
    res <- readLines(con)
    close(con)
    options(prevopt)
    return(res)
}


# simple-JSON for lists containing character strings
simpsON <- function(x) {
	if(!is.list(x) && length(x) == 1L) return(encodeString(x, quote = '"'))
	x <- lapply(x, simpsON)
	x <- if(is.list(x) || length(x) > 1L) {
		nms <- names(x)
		if(is.null(nms))
			paste('[', paste(x, collapse = ','), ']', sep = "")
		else
			paste("{", paste(paste(encodeString(make.unique(nms, sep = '#'),
				quote = '"'), ":", x, sep = ""), collapse = ","),"}",
				  sep = "")
	}
	x
}

## tcl-based JSON - not working properly so far.
#tcJSON <- function(x, msg = "Done") {
#	.Tcl("set result {}")
#	tcl(if(length(x) == 1) "lappend" else "set", "result", x)
#	.Tcl("set retval [dict create]")
#	.Tcl("dict set retval result $result")
#	tcl("dict", "set", "retval", "message", msg)
#	.Tcl("set retval [compile_json {dict result list message string} $retval]")
#}

init.Rserver <- function() {
	if(!file.exists("rserver.tcl")) stop("Cannot find file 'rserver.tcl'")
	tcl('source', "rserver.tcl")
	tcl('source', "compile_json.tcl")
	tclfun(TclReval, "Rserver::Reval", retval = "retval")
	tclfun(TclRprint, 'Rserver::Rprint')
	#tclfun(tcJSON, "TestJSON", retval = "retval")
	cat("R server (tcl) functions defined \n")

}

#===============================================================================

#.init.Rserver()

#===============================================================================
#sv_startServer(11111)
#listConnections()
#listServers()
#stopAllServers()
#stopAllConnections()
#tcl("Rserver::Reval", "runif(4)", "")

#===============================================================================
