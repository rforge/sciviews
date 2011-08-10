# inspired by 'capture.output' and utils:::.try_silent
# Requires: R >= 2.13.0 [??]
`captureAll` <- function(expr, split = FALSE, file = NULL, markStdErr=FALSE) {
	# TODO: support for 'file' and 'split'

	# markStdErr: if TRUE, stderr is separated from sddout by STX/ETX character

	last.warning <- list()
	Traceback <- list()
	NframeOffset <- sys.nframe() + 19L # frame of reference (used in traceback) +
								 # length of the call stack when a condition
								 # occurs
	# Note: if 'expr' is a call not expression, 'NframeOffset' is lower by 2
	# (i.e. 21): -1 for lapply, -1 for unwrapping 'expression()'

	getWarnLev <- function() options('warn')[[1L]] # this may change in course of
		# evaluation, so must be retrieved dynamically

	rval <- NULL
	tconn <- textConnection("rval", "w", local = TRUE)
	sink(tconn, type = "output"); sink(tconn, type = "message")
	on.exit({
		sink(type = "message"); sink(type = "output")
		close(tconn)
	})

	inStdOut <- TRUE
	marks <- list()

	if (markStdErr) {
		putMark <- function(to.stdout, id) {

			do.mark <- FALSE
			if (inStdOut) {
				if (!to.stdout) {
					cat("\x03")
					inStdOut <<- FALSE
					do.mark <- TRUE
			}} else { # in StdErr stream
				if (to.stdout) {
					cat("\x02")
					inStdOut <<- TRUE
					do.mark <- TRUE
			}}

			if(do.mark)
			marks <<- c(marks, list(c(pos = sum(nchar(rval)), stream = to.stdout)))
			#cat("<", id, inStdOut, ">")
		}
	} else {
		putMark <- function(to.stdout, id) {}
	}

	`evalVis` <- function(x) withVisible(eval(x, .GlobalEnv))

	`restartError` <- function(e, calls, off) {
		# remove call (eval(expr, envir, enclos)) from the message
		ncls <- length(calls)

		#DEBUG
		#cat("n calls: ", ncls, "NframeOffset: ", NframeOffset, "\n")
		#print(e$call)
		#print(off)
		#print(calls[[NframeOffset]])
		#print(calls[[NframeOffset+ off]])
		#browser()

		if(isTRUE(all.equal(calls[[NframeOffset + off]], e$call, check.attributes=FALSE)))
			e$call <- NULL

		Traceback <<- rev(calls[-c(seq.int(NframeOffset + off), (ncls - 1L):ncls)])

#> cat(captureAll(expression(1:10, log(-1),log(""),1:10)), sep="\n")


		putMark(FALSE, 1L)
		cat(.makeMessage(e))
		if(getWarnLev() == 0L && length(last.warning) > 0L)
			cat(gettext("In addition: ", domain="R"))
	}

	if(!exists("show", mode="function")) show <- base::print

	res <- tryCatch(withRestarts(withCallingHandlers({
			# TODO: allow for multiple expressions and calls (like in
			# 'capture.output'). The problem here is how to tell 'expression'
			# from 'call' without evaluating it?
			#list(evalVis(expr))

			for(i in expr) {
				off <- 0L # TODO: better way to find the right sys.call...
				res1 <- evalVis(i)
				#cat('---\n')
				# this will catch also 'print' errors
				off <- -3L
				if(res1$visible) show(res1$value)
			}
		},

		error = function(e) invokeRestart("grmbl", e, sys.calls(), off),
		warning = function(e) {
			# remove call (eval(expr, envir, enclos)) from the message
			if(isTRUE(all.equal(sys.call(NframeOffset), e$call, check.attributes=FALSE)))
				e$call <- NULL

			last.warning <<- c(last.warning, structure(list(e$call), names=e$message))

			if(getWarnLev() != 0L) {
				putMark(FALSE, 2L)
				.Internal(.signalCondition(e, conditionMessage(e), conditionCall(e)))
				.Internal(.dfltWarn(conditionMessage(e), conditionCall(e)))
				putMark(TRUE, 3L)
			}
			invokeRestart("muffleWarning")

		}),
	# Restarts:

	# Handling user interrupts. Currently it works only from within R.
	# TODO: how to trigger interrupt remotely?
	abort = function(...) {
		putMark(FALSE, 4L)
		cat("Execution aborted.\n") #DEBUG
	},

	muffleWarning = function() NULL,
	grmbl = restartError),
	error = function(e) { #XXX: this is called if warnLevel=2
		putMark(FALSE, 5L)
		cat(.makeMessage(e))
		e #identity
	}, finally = {	}
	)

	#lapply(res, function(x) {
	#	if(inherits(x, "list") && x$visible) {
	#		print(x$value)
	#	} #else { cat('<invisible>\n') }
	#})

	if(getWarnLev() == 0L) {
		nwarn <- length(last.warning)
		assign("last.warning", last.warning, envir=baseenv())

		if(nwarn > 0L) putMark(FALSE, 6L)
		if(nwarn <= 10L) {
			print.warnings(last.warning)
		} else if (nwarn < 50L) {
		   cat(gettextf("There were %d warnings (use warnings() to see them)\n", nwarn, domain="R"))
		} else {
			cat(gettext("There were 50 or more warnings (use warnings() to see the first 50)\n", domain="R"))
		}
	}
	putMark(TRUE, 7L)

	sink(type = "message"); sink(type = "output")
	close(tconn)
	on.exit()

	# allow for tracebacks of this call stack:
	assign(".Traceback", lapply(Traceback, deparse), envir = baseenv())

	attr(rval, "marks") <- marks

	return(rval)
}