\name{assignTemp}
\alias{assignTemp}

\title{ Assign a temporary variable in the SciViews:TempEnv environment }
\description{
  The function assigns a variable to SciViews:TempEnv, an environment dedicated
  to temporary variables (especially useful for GUIs).
}

\usage{
assignTemp(x, value, replace.existing = TRUE)
}

\arguments{
  \item{x}{ the name of the variable. }
  \item{value}{ the value of the variable. }
  \item{replace.existing}{ do we replace an existing variable? }
}

\author{ Philippe Grosjean <phgrosjean@sciviews.org> }

\seealso{\code{\link{TempEnv}}, \code{\link{changeTemp}}, \code{\link{getTemp}},
  \code{\link{rmTemp}}, \code{\link{existsTemp}}, \code{\link{addTemp}},
  \code{\link{tempvar}}}

\examples{
assignTemp("test", 1:10)
## Retrieve this variable
getTemp("test")
}

\keyword{ utilities }

\concept{ temporary variables }
