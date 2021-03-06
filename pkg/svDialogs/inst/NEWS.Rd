\name{NEWS}
\title{NEWS file for the svDialogs package}

\section{Changes in version 0.9-57}{
	\itemize{
		\item{ Added requirements (zenity) in the DESCRIPTION file. }
	}
}

\section{Changes in version 0.9-56}{
	\itemize{
		\item{ The native Mac dialogs did not work any more, solved for 10.5
		  Leopard and above by querying the name of the application by its id
		  (Rgui). }
	}
}

\section{Changes in version 0.9-55}{
	\itemize{
		\item{ Rework of Author and Authors@R fileds in the DESCRIPTION file. }
	}
}

\section{Changes in version 0.9-54}{
	\itemize{
		\item{ Dependencies to tcltk and svMisc are eliminated.
		    Consequently, all functions that depend on Tcl/Tk are eliminated
		    too. It concerns \code{guiDlg()}, \code{guiDlgFunction()} and
		    other associated methods or functions. The new \code{dlgForm()}
		    function should be used instead. }
		\item{ Temporary objects are now saved in SciViews:TempEnv instead of
		    TempEnv. }
	}
}

\section{Changes in version 0.9-53}{
	\itemize{
		\item{ Added support for \preformatted{JGR} in dialog boxes under Mac OS X. }
		
		\item{ The \code{menuXXX()} functions can manage menus and submenus in JGR. }
	}
}

\section{Changes in version 0.9-52}{
	\itemize{
		\item{ \code{menuXXX()} functions do not generate files in
			\preformatted{tmp} dir on Linux, unless in \code{interactive()} session,
			and with explicit user's acknowledgement. Moreover, the user name is not
			used anymore as part of the name of the temporary files generated (cf CRAN
			policies and following B. Ripley's request). }
	
		\item{ Code to manage \code{menuXXX()} items on Mac OS X is considered
			still experimental (on R-forge, not CRAN) and is now commented out. Will
			be further developed in a future version of the \pkg{svDialogs} package. }
	}
}

\section{Changes in version 0.9-51}{
	\itemize{
		\item{ NEWS file reworked to use the new Rd format. }
	}
}

\section{Changes in version 0.9-50}{
	\itemize{
		\item{ Slight changes in flexible dialog functions according to notes
			generated by \preformatted{R CMD check} (2.15.0), i.e., partial matching
			of argument env(ir) and use of \code{.Internal} in \code{eval.with.vis()};
			replaced by the function \code{withVisible()}. }
  }
}

\section{Changes in version 0.9-49}{
	\itemize{
		\item{ Added \code{dlgForm()} for flexible form dialog box. Only the Linux
			implementation using \code{yad} and the textual version are currently
			done. }
	}
}

\section{Changes in version 0.9-48}{
	\itemize{
		\item{ Argument message is changed to title in \code{dlgDir()} function, to
			match corresponding argument in \code{dlgOpen()} and \code{dlgSave()} and
			also to indicate it can only be a single line of text. }
		
		\item{ Added \code{msgBox()} and \code{okCancelBox()} functions for simpler
			message box handling. }

		\item{ \code{dlgOpen()} is now implemented and its textCLI version also
			accepts single and double quotes around file path (allow to drag-and-drop
			from, e.g., nautilus to gnome-terminal in Gnome Linux), on the contrary to
			\code{file.choose()}. }
		
		\item{ \code{dlgFilters} is similar to Filters matrix under Windows, and it
			provides a series of default file types and filters for \code{dlgOpen()}
			and \code{dlgSave()}. }
		
		\item{ \code{dlgSave()} is also implemented, but it uses
			\code{choose.files()} on Windows, which is merely designed to open file(s)
			instead of providing a file name to save to. }
  }
}

\section{Changes in version 0.9-47}{
	\itemize{
		\item{ Now, \code{menuAddItem()} implements \code{'enable'} and
			\code{'disable'} in action to change the state of an existing menu item. }
		
		\item{ On Windows, using an action as \code{'enable'} or \code{'disable'} on
			nonexisting menus just does nothing (on the contrary to the original
			\code{winMenuAddItem()} which creates that menus with the action being
			\code{'enable'} or \code{'disable'}, respectively). }
		
		\item{ \code{'$ConsoleMain/<menu>'} is now accepted as a synonym of
		\code{'<menu>'} in all \code{menuXXX()} functions, according to
		corresponding \code{winMenuXXX()} functions. }
		
		\item{ The \code{menuXXX()} functions now check for bad synthax with the
			special menus	\code{$ConsoleMain}, \code{$ConsolePopup},
			\code{$Graph<n>Main} and \code{$Graph<n>Popup}: special menu not followed
			by at least one submenu. }
		
		\item{ The console context menu is now implemented too, and
			\code{'$ConsolePopup/<menu>'} menus allow for adding submenus to it. }
		
		\item{ Addition of \code{menuNames()} and \code{menuItems()}, working the
			same way as \code{winMenuNames()} and \code{winMenuItems()} under
			Windows. }
	}
}

\section{Changes in version 0.9-46}{
	\itemize{
		\item{ The functions to handle menus in Linux are completely rewritten to
			use a menu configuration file that a modified version of myGtkMenu (named
			ctxmenu) can read and interpret to display the corresponding menus. }
	}
}

\section{Changes in version 0.9-45}{
	\itemize{
		\item{ Similar custom menus as \code{winMenuXXX()} functions are added and
			allow to add custom menus on the Mac (both R.app and terminal) and for R
			run on a Gnome desktop, providing the system is configured to manage such
			menus, see \code{?menuAdd}. }
	}
}

\section{Changes in version 0.9-44}{
	\itemize{
		\item{ The \code{guiDlgXXX()} functions are reworked into S3 methods and
			their interface changes. To avoid any confusion, they are renamed
			\code{dlgXXX()}. }
	
		\item{ \code{dlgMessage()} is reworked into native dialog box, but it looses
			a couple of options during the process (title, icon, parent). The previous
			code is now moved to \pkg{svDialogstcltk}. }
			
		\item{ \code{dlgInput()} is reworked the same way, and it looses the
			\code{'parent'} argument that was not implemented yet, anyway, and the
			\code{'title'} argument that is now always \code{"question"} in order to
			match \code{winDialogString()} function for Windows. }
			
		\item{ \code{dlgList()} is also refactored that way. Its interface is
			completely changed to better match the arguments of \code{select.list()}
			and to make it a direct replacement for that function. }
			
		\item{ \code{dlgDir()} is completely rewritten, as well as, \code{dlgOpen()}
			and \code{dlgSave()}. }
	}
}

\section{Changes in version 0.9-43}{
	\itemize{
		\item{ The \pkg{tcltk} \R package is moved from depends to imports. }
	}
}

\section{Changes in version 0.9-42}{
	\itemize{
		\item{ \code{guiDlgFun()} is adapted to the new help system provided in
			\R 2.10. }
	}
}

\section{Changes in version 0.9-41}{
	\itemize{
		\item{ When the path contained spaces, \code{guiDlgOpen()} and
			\code{guiDlgSave()} returned them in pieces. }
	}
}

\section{Changes in version 0.9-40}{
	\itemize{
		\item{ This is the first version distributed on R-forge. It is completely
			refactored from older versions (on CRAN since 2003) to make it run with
			\preformatted{SciViews-K} and \preformatted{Komodo Edit} (
			\preformatted{SciViews-R Console} not supported any more). }
	}
}
