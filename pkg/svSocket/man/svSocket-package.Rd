\name{svSocket-package}
\alias{svSocket-package}
\alias{svSocket}
\docType{package}

\title{ SciViews GUI API - R Socket Server }
\description{
  The SciViews svSocket package provides a stateful, multi-client and preemtive
  socket server. Socket transaction are operational even when R is buzy in its
  main event loop (calculation done at the prompt). This R socket server uses
  the excellent asynchronous socket ports management by Tcl, and thus, it needs
  a working version of Tcl/Tk (>= 8.4) and of the tcltk R package.
  
  A particular effort has been made to handle requests the same way as if they
  where introduced at the command prompt, including presentation of the output.
  However, the server sends results back to the client only at the end of the
  computations. It means that any interaction during computation (for instance,
  using scan(), browser(), or par(ask = TRUE) is not echoed in the client on due
  time. If you parameterize the socket server to echo commands in the R console,
  such interaction would be possible from there. Another option is to run R in
  non-interactive mode (switching to non-interactive mode during the R session
  is possible by using the interactivity R package available on CRAN).
  
  Although intially designed to server GUI clients, the R socket server can also
  be used to exchange data between separate R processes. The evalServer()
  function is particularly useful for this. Note, however, that R objects are
  serialized into a text (i.e., using dump()) format, currently. It means that
  the transfer of large object is not as efficient as, say Rserver (Rserver
  exchanges R objects in binary format, but Rserver is not stateful, clients
  do not share the same global workspace and it does not allow concurrent use
  of the command prompt).
  
  See \code{\link{startSocketServer}} and \code{\link{processSocket}} for
  further implementation details.
}
\details{
  \tabular{ll}{
    Package: \tab svSocket\cr
    Type: \tab Package\cr
    Version: \tab 0.9-57\cr
    Date: \tab 2014-03-02\cr
    License: \tab GPL 2 or above, at your convenience\cr
  }
  % TODO: add description of main functions here. Also add examples
}

\author{
  Philippe Grosjean & Matthew Doyle.

  Maintainer: Ph. Grosjean <phgrosjean@sciviews.org>
}

\keyword{ package }
\keyword{ utilities }

\concept{ GUI API socket server }
