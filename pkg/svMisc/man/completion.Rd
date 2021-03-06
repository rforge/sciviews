\name{completion}
\alias{completion}

\title{ Get a completion list for a R code fragment }
\description{
  Returns names of objects/arguments/namespaces matching a code fragment.
}
\usage{
completion(code, pos = nchar(code), min.length = 2, print = FALSE,
    types = c("default", "scintilla"), addition = FALSE, sort = TRUE,
    what = c("arguments", "functions", "packages"), description = FALSE, 
    max.fun = 100, skip.used.args = TRUE, sep = "\n", field.sep = "\t")
}
\arguments{
  \item{code}{ a partial R code to be completed. }
  \item{pos}{ the position of the cursor in this code. }
  \item{min.length}{ the minimal length in characters of \code{code} required
    before the completion list is calculated. }
  \item{print}{ logical, print result and return invisibly. See details. }
  \item{types}{ a named list giving names of types. Set to \code{NA} to give
      only names. See details. }
  \item{addition}{ should only addition string be returned? }
  \item{sort}{ do wer sort the list of completions alphabetically? }
  \item{what}{ what are we looking for? Allow to restrict search for faster
    calculation. }
  \item{description}{ do we describe items in the completion list
    (may be slow)? }
  \item{max.fun}{ in case we describe items, the maximum number of functions to
    process (if longer, no description is returned for function) because it can
    bz very slow otherwise. }
  \item{skip.used.args}{ logical, if completion is within function arguments,
    should the already used named arguments be omitted? }
  \item{sep}{ the separator to use between returned items. }
  \item{field.sep}{ character string to separate fields for each entry. }
}

\value{
  If \code{types == NA} and \code{description = FALSE}, a character vector
  giving the completions, otherwise a data frame with two columns: 'completion',
  and 'type' when \code{description = FALSE}, or with four columns: "completion',
  'type', 'desc' and 'context' when \code{description = TRUE}.\cr
  Attributes:\cr
    \code{attr(,"token")} - a completed token.\cr
    \code{attr(,"triggerPos")} - number of already typed characters.\cr
    \code{attr(,"fguess")} - name of guessed function.\cr
    \code{attr(,"isFirstArg")} - is this a first argument?
}

\details{
  The completion list is context-dependent, and it is calculated as if the
  code was entered at the command line.

  If the code ends with \code{$} or \code{[[}, then the function look for
  items in a list or data.frame whose name is the last identifier.

  If the code ends with \code{@}, then the function look for slots of the
  corresponding S4 object.

  If the code ends with \code{::}, then it looks for objects in a namespace.

  If the code ends with a partial identifier name, the function returns all
  matching keywords visible from .GlobalEnv.

  If the code is empty or parses into an empty last token, the list of objects
  currently in the global environment is returned.
  
  Take care: depending on the context, the completion list could be incorrect
  (but it should work for code entered at the command line). For instance,
  inside a function call, the context is very different, and arguments and local
  variables should be returned instead. This may be implemented in the future,
  but for now, we focus on completion that should be most useful for novice
  useRs that are using rather simple commands entered one after the other in
  a script (and considering the script is run or sourced line after line in R).

  There are other situations where the completion can be calculated, see
  the help of \code{rc.settings()}.

  If \code{print} == \code{TRUE}, results are returned invisibly, and printed
  in a form: triggerPos[newline]completions separated by \code{sep}.\cr

  If \code{types} are supplied, a completion will consist of name and type,
  separated by \code{type.sep}. \code{types} may me a vector of length 5,
  giving the type codes for "function", "variable", "environment", "argument"
  and "keyword". If \code{types == "default"}, above type names are given;
  \code{types == "scintilla"} will give numeric codes that can be used
  with "scintilla.autoCShow" function (SciViews-K Komodo Edit plugin).
}

\author{ Philippe Grosjean <phgrosjean@sciviews.org> & Kamil Barton }

\seealso{ \code{\link[utils]{rc.settings}}. }

\examples{
## a data.frame
data(iris)
completion("item <- iris$")
completion("item <- iris[[")

## An S4 object
setClass("track", representation(x = "numeric", y = "numeric"))
t1 <- new("track", x = 1:20, y = (1:20)^2)
completion("item2 <- t1@")

## A namespace
completion("utils::", description = TRUE)

## A partial identifier
completion("item3 <- va", description = TRUE)

## Otherwise, a list with the content of .GlobalEnv
completion("item4 <- ")

## TODO: directory and filename completion!

rm(iris, t1)
}

\keyword{ utilities }

\concept{ Graphical user interface (GUI) control, completion }
