\name{parSocket}
\alias{parSocket}

\title{ Get or set parameters specific to Sciviews socket clients }

\description{
  This function manage to persistently store sensible parameters for configuring
  communication between the server and the client, as well as, any other
  persitent data you may need. Parameters remain set even if the client
  disconnects and then reconnects to R, as long R was not restarted.
}

\usage{
parSocket(client, serverport = 8888, clientsocket = client, \dots)
}

\arguments{
  \item{client}{ the client identification. By default, it is the socket
    identifier as it appears in \code{getSocketClients()}. Since no attempt is
    made to check if the client really exists and is connected, you can create
    fake ones, outside of the socket server, to test your code for instance. }
  \item{serverport}{ the port on which the server is running, 8888 by default.
    Not important for fake socket client configurations. }
  \item{clientsocket}{ the Tcl name of the socket where the client is
    connected. By default, it is the same as \code{client} name, but in case
    it was modified, do provide a correct \code{clientsocket} string if you
    want to be able to activate a redirection to it (see
    \code{socketClientConnection()}). }
  \item{\dots}{ the parameters you want to change as named arguments. Non
    named arguments are ignored with a warning. If you specify
    \code{arg = NULL}, the corresponding variable is deleted from the
    environment. }
}

\value{
  Returns the environment where parameters and data for the client are stored.
  To access those data, see examples below.
  
}

\note{
  You can assign the environment to a variable, and then, access its content
  like if it was a list (\code{e$var} or \code{e$var <- "new value"}). To get
  a list of the content, use \code{ls(parSocket(client, port))}, or
  \code{ls(parSocket(client, port), all.names = TRUE)}, but not
  \code{names(parSocket(client, port))}. As long as you keep a variable pointing
  on that environment alive, you have access to last values (i.e., changes done
  elsewhere are taken into account). If you want a frozen snapshot of the
  parameters, you should use \code{myvar <- as.list(parSocket(client, port)}
  
  There is a convenient placeholder for code send by the client to insert
  automatically the right socket and serverport in \code{parSocket()}: <<<s>>>.
  Hence, code that the client send to access or change its environment is just
  \code{parSocket(<<<s>>>, bare = FALSE)} or \code{parSocket(<<<s>>>)$bare} to
  set or get one parameter. Note that you can set or change many parameters at
  once.
  
  Currently, parameters are: \code{bare = TRUE|FALSE} for "bare" mode (no
  prompt, no echo, no multiline; be default, \code{bare = TRUE}),
  \code{multiline = TRUE|FALSE}: does the server accept code spread on multiple
  lines and send in several steps (by default, yes, but works only if
  \code{bare = FALSE}. \code{echo = TRUE|FALSE} is the command echoed to the
  regular R console (by default \code{echo = FALSE}). \code{last = ""} string
  to append to each output (for instance to indicate that processing is done),
  \code{prompt = "> "}, the prompt to use (if not in bare mode) and
  \code{continue = "+ "} the continuation prompt to use, when multiline mode is
  active. You can only cancel a multiline mode by completting the R code you
  are sending to the server, but you can break it too by sending <<<esc>>>
  before the next instruction. You can indicate <<<q>>> or <<<Q>>> at
  the very beginning of an instruction to tell R to disconnect the connection
  after the command is processed and result is returned (with <<<q>>>), or when
  the instructions are received but before they are processed (with <<<Q>>>).
  This is useful for "one shot" clients (clients that connect, send code and
  want to disconnect immediatelly after that). The code send by the server to
  the client to tell him to disconnect gracefully (and do some housekeeping) is
  '\\f' send at the beginning of one line. So, clients should detect this and
  perform the necessary actions to gracefully disconnect from the server as
  soon as possible, and he cannot send further instructions from this moment on.
  
  For clients that repeatedly connect and disconnect, but want persistent data,
  the default client identifier (the socket name) cannot be used, because that
  socket name would change from connection to connection. The client must then
  provide its own identifier. This is done by sending \code{<<<id=myID>>>} at
  the very beginning of a command. This must be done for all commands!
  \code{myID} must use only characters or digits. This code could be followed
  by \code{<<<e>>>}, \code{<<<h>>>} or \code{<<<H>>>}. These commands are
  intended for R editors/IDE. The first code \code{<<<e>>>} sets the server into
  a mode that is suitable to evaluated R code (including in a multi-line way).
  The other code temporarily configure the server to run the command (in single
  line mode only) in a hidden way. They can be used to execute R code without
  displaying it in the console (for instance, to start context help, to get a
  calltip, or a completion list, etc.). The differences between \code{<<<h>>>}
  and \code{<<<H>>>} is that the former waits for command completion and returns
  results of the command to the client before disconnecting, while the latter
  disconnects from the client before executing the command.
  
  There is a simple client (written in Tcl) available in the /etc subdirectory
  of this package installation. Please, read the 'ReadMe.txt' file in the same
  directory to learn how to use it. You can use this simple client to experiment
  with the communication using these sockets, but it does not provide advanced
  command line edition, no command history, and avoid pasting more than one line
  of code into it.
}

\author{Philippe Grosjean (\email{phgrosjean@sciviews.org})}

\seealso{ \code{\link{startSocketServer}}, \code{\link{sendSocketClients}},
  \code{\link{getSocketClients}}, \code{\link{socketClientConnection}}. }

\examples{
## We use a fake socket client configuration environment
e <- parSocket("fake")
## Look at what it contains
ls(e)
## Get one data
e$bare
## ... or
parSocket("fake")$bare

## Change it
parSocket("fake", bare = FALSE)$bare
## Note it is changed too for e
e$bare

## You can change it too with
e$bare <- TRUE
e$bare
parSocket("fake")$bare

## Create a new entry
e$foo <- "test"
ls(e)
parSocket("fake")$foo
## Now delete it
parSocket("fake", foo = NULL)
ls(e)

## Our fake socket config is in SciViews:TempEnv environment
s <- search()
l <- length(s)
pos <- (1:l)[s == "SciViews:TempEnv"]
ls(pos = pos)  # It is named 'SocketClient_fake'
## Delete it
rm(SocketClient_fake, pos = pos)
## Do some house keeping
rm(list = c("s", "l", "pos"))
}

\keyword{ IO }

\concept{ stateful socket server interprocess communication }
