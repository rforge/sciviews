# 'getFunArgs': returns function argument names, if 'object' is provided and 'f'
#    is generic (either S3 or S4), returns only arguments for an appropriate
#    method and/or default method if not found.
# Usage:
#    getFunArgs("anova", fm1) # if 'fm1' is of class 'glm', it returns argument
#    						  #names for 'anova.glm'
#    getFunArgs("[", object)
#    getFunArgs("stats::`anova`", fm1) # function names may be backtick quoted,
#                                      # and have a namespace extractor
# Note: the function assumes that method is dispatched based on the first
#    argument which may be incorrect.
#    TODO: should check whether the name of the argument is also the first
#    argument for the generic function.

# 'completeSpecial' prints newline separated completions for some special cases.
#    currently package, namespace, graphical parameters, 'options' names
#    and quoted items for  use with `[` or `[[`


# "imports":
tail <- utils::tail
getS3method <- utils::getS3method
findGeneric <- utils:::findGeneric

`sv_completeArgs` <- function(FUNC.NAME, ..., field.sep = "\x1e") {
	rx <- regexpr("^([\\w\\.]+):{2,3}(`|)([\\w\\.\\[\\%]+)\\2$", FUNC.NAME, perl = TRUE)
	if (rx == 1L) {
		cs <- attr(rx,"capture.start")
		fn <- substring(FUNC.NAME, cs, cs - 1L + attr(rx,"capture.length"))[c(1,3)]
		FUNC.NAME <- fn[2L]
		envir <- asNamespace(fn[1L])
		inherit <- FALSE
	} else {
		envir <- .GlobalEnv
		inherit <- TRUE
	}
	#cat(FUNC.NAME, "\n")

	if(exists(FUNC.NAME, envir = envir, mode = "function", inherits = inherit)) {
		fun <- get(FUNC.NAME, envir = envir, mode = "function", inherits = inherit)
	} else
		fun <- NULL

	if(is.null(fun) || mode(fun) != "function") return(NULL)
	if (findGeneric(FUNC.NAME, envir) != "" || is.primitive(fun)) {
		cl <- sys.call()
		cl$field.sep <- NULL
		cls <- NA_character_
		if(length(cl) > 2L){
			object <- cl[[3L]]
			if (!missing(object)) {
				if(mode(object) == "call") {
					if ("~" %in% all.names(object, functions = TRUE, max.names = 4L))
						cls <- "formula"
				} else {
					object <- tryCatch(eval(object), error = function(e) NULL)
					cls <- class(object)
				}
			}
		}

		if(is.na(cls[1L])) {
			ret <- names(formals(getS3method(FUNC.NAME, "default",
				optional = TRUE)))
		} else {
			ncls <- length(cls)
			ret <- vector(ncls + 2L, mode = "list")
			if(isS4(object)) ret[[1L]] <- formals(selectMethod(FUNC.NAME, cls,
				optional = TRUE))
			ret[seq_len(ncls)] <- lapply(cls, function(x)
				names(formals(getS3method(FUNC.NAME, x, optional = TRUE))))
			if(all(vapply(ret, is.null, TRUE)))
				ret <- names(formals(getS3method(FUNC.NAME, "default",
					optional = TRUE)))
			else
				ret <- unique(unlist(ret, FALSE, FALSE))
		}
	} else ret <- character(0L)
	ret <- unique(c(ret, names(formals(args(fun)))))
	if (length(ret) > 1L && (FUNC.NAME == "[" || FUNC.NAME == "[["))
		ret <- ret[-1L]

	cat(paste("argument", field.sep, ret[ret != "..."], " =", sep = ""), sep = "\n")
	return(invisible(NULL))
}

# provide special completions
`sv_completeSpecial` <- function(what, x = NULL, field.sep = "\x1e") {
	res <- switch(what, search = {
			type <- "namespace"
			res <- search()
			res[!(res %in% c(".GlobalEnv", "package:tcltk", "package:utils",
				"komodoConnection", "package:methods", "SciViews;TempEnv",
				"Autoloads", "package:base"))]
	   }, library = {
			type <- "module"
			unique(unlist(lapply(.libPaths(), dir), use.names = FALSE))
	   }, par = {
			type <- "argument"
			res <- sv_completion("par(", sep = NULL)[]
			paste(substr(res, 1, nchar(res) - 1), "=")
			#names(par())
	   }, options = {
			type <- "argument"
			paste(names(options()), "=")
	   }, "[" = {
			type <- "$variable'"
			tryCatch(paste("\"", names(x), "\"", sep = ""),
							error = function(e) "")
	   }, return(invisible(NULL)))
	cat(paste(type, res, sep = field.sep), sep = "\n")
	return(invisible(NULL))
}


# From svMisc::completion (simplified)

`sv_completion` <- function (code, field.sep = "\x1e", sep = "\n",
						  pos = nchar(code), min.length = 2L,
						  addition = FALSE, max.fun = 100L,
						  skip.used.args = FALSE) {

	types <- list(fun = "function", var = "variable",
		env = "environment", args = "argument", keyword = "keyword")

	## Default values for completion context
	token <- ""
	#triggerPos <- 0L
	#fguess <- ""
	#funargs <- list()
	#isFirstArg <- FALSE

	## Is there some code provided?
	code <- paste(as.character(code), collapse = "\n")
	if (is.null(code) || !length(code) || code == "" ||
		nchar(code, type = "chars") < min.length) {
		return(invisible(NULL))
	}

	## If code ends with a single [, then look for names in the object
	if (regexpr("[^[][[]$", code) > 0L) {
		## TODO: look for object names... currently, return nothing
		return(invisible(""))
	}

	## If code ends with a double [[, then, substitute $ instead and indicate
	## to quote returned arguments (otherwise, [[ is not correctly handled)!
	if (regexpr("[[][[]$", code) > 0L) {
		code <- sub("[[][[]$", "$", code)
		dblBrackets <- TRUE
	} else dblBrackets <- FALSE

	## Save funarg.suffix and use " = " locally
	ComplEnv <- utils:::.CompletionEnv


	## Calculate completion with standard R completion tools
	utils:::.assignLinebuffer(code)
	utils:::.assignEnd(pos)
	utils:::.guessTokenFromLine()
	## The standard utils:::.completeToken() is replaced by our own version:
	#.completeTokenExt()
	utils:::.completeToken()
	completions <- utils:::.retrieveCompletions()
	#triggerPos <- pos - ComplEnv[["start"]]
	token <- ComplEnv[["token"]]

	## For tokens like "a[m", the actual token should be "m"
    ## completions are modified accordingly
    rx <- regexpr("[[]+", ComplEnv$token)
    if (rx > 0L) {
    	## Then we need to trim out whatever is before the [ in the completion
    	## and the token
    	start <- rx + attr(rx, "match.length")
    	ComplEnv$token <- substring(ComplEnv$token, start)
    	completions <- substring(completions, start)
    }
	if (!length(completions)) return(invisible(""))

	## Remove weird object names (useful when the token starts with ".")
    i <- grep("^[.]__[[:alpha:]]__", completions)
	if (length(i) > 0L) completions <- completions[-i]
    if (!length(completions)) return(invisible(""))

	## Eliminate function arguments that are already used
	#fguess <- ComplEnv$fguess
	#if (skip.used.args && length(fguess) && nchar(fguess))
		#completions <- completions[!(completions %in% ComplEnv$funargs)]
	#if (!length(completions)) return(invisible(""))

	## Eliminate function names like `names<-`
	i <- grep("<-.+$", completions)
	if (length(i) > 0L) completions <- completions[-i]

	## Do we return only additional strings for the completion?
	#if (isTRUE(addition) && triggerPos > 0L)
		#completions <- substring(completions, triggerPos + 1L)

	## In case of [[, restore original code
	if (dblBrackets) {  # Substitute var$name by var[["name"
		completions <- sub("\\$(.+)$", '[["\\1"', completions)
		#token <- sub("\\$$", "[[", token)
		#triggerPos <- triggerPos + 1L
	}

	## Finalize processing of the completion list
	#funargs <- ComplEnv$funargs
	#isFirstArg <- ComplEnv$isFirstArg

	tl <- integer(length(completions))
	tl[grep(" = $", completions)] <- 4L
	tl[grep("::$", completions)] <- 3L
	tl[grep("<-$", completions)] <- 1L
	tl[completions %in% .reserved.words] <- 5L
	tl[!tl] <- ifelse(sapply(strsplit(completions[!tl], ":::?"), function(x) {
		if(length(x) == 2) exists(x[2], where = asNamespace(x[1]),
								  mode = "function")
		else exists(x, where = .GlobalEnv, mode = "function")	}),  1L, 2L)
	tl <- factor(tl, levels = seq_len(5L), labels = types)

	if(!is.null(sep)) cat(paste(tl, completions, sep = field.sep), sep = sep)
	invisible(completions)
}

.reserved.words <- c("if", "else", "repeat", "while", "function", "for", "in",
	"next", "break", "TRUE", "FALSE", "NULL", "Inf", "NaN", "NA", "NA_integer_",
	"NA_real_", "NA_complex_", "NA_character_")


## Similar to "find" but `what` can be a vector
## also, this one only searches in packages (position of the search path
## matching '^package:') and only gives one result per what
.find.multiple <- function (what)
{
    stopifnot(is.character(what))
    sp <- grep( "^package:", search(), value = TRUE)
    out <- rep( "" , length(what))
    for (i in sp) {
        ok <- what %in% ls(i, all.names = TRUE) & out == ""
        out[ok] <- i
        if (all(out != "")) break
    }
    names(out) <- what
    return(sub("^package:", "", out))
}
