# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License
# Version 1.1 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS"
# basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
# License for the specific language governing rights and limitations
# under the License.
#
# The Original Code is SciViews-K by Philippe Grosjean et al.
#
# Contributor(s):
#   Philippe Grosjean
#   ActiveState Software Inc (code inspired from)
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

# Komodo R wiki language service

import logging
from koUDLLanguageBase import KoUDLLanguage
from xpcom import components #, nsError, COMException, ServerException


log = logging.getLogger("koRwikiLanguage")
#log.setLevel(logging.DEBUG)


def registerLanguage(registry):
    log.debug("Registering language R wiki")
    registry.registerLanguage(KoRwikiLanguage())


class KoRwikiLanguage(KoUDLLanguage):
    name = "Rwiki"
    lexresLangName = "Rwiki"
    _reg_desc_ = "%s Language" % name
    _reg_contractid_ = "@activestate.com/koLanguage?language=%s;1" % name
    _reg_clsid_ = "{7de21e4c-23d3-513c-9b31-6e8dc4ab72bf}"
    _reg_categories_ = [("komodo-language", name)]
    defaultExtension = '.Rwiki'
    primary = 1
    lang_from_udl_family = {
        'M': None
    }

    commentDelimiterInfo = {
        "line": [ "#", ],
    }

    downloadURL = "http://www.sciviews.org"
    searchURL = "http://www.rseek.org/"

    variableIndicators = '$'
    _dedenting_statements = [u'return', u'break', u'else', u'next']
    _indenting_statements = [u'switch', u'if', u'ifelse', u'while', u'for', u'repeat']
    supportsSmartIndent = "brace"

    #styleStdin = components.interfaces.ISciMoz.SCE_C_STDIN
    #styleStdout = components.interfaces.ISciMoz.SCE_C_STDOUT
    #styleStderr = components.interfaces.ISciMoz.SCE_C_STDERR


    sample = """== A h2 title
    
A  paragraph of text with **bold** //italic// text...

* Item 1,
* Item 2

"""

    # Overriding these base methods to work around bug 81066.
    def get_linter(self):
        None
        #return self._get_linter_from_lang("R")
    def get_interpreter(self):
        None

    #def get_lexer(self):
    #    return None
    #    if self._lexer is None:
    #        self._lexer = KoLexerLanguageService()
    #        self._lexer.setLexer(components.interfaces.ISciMoz.SCLEX_CPP)
    #        self._lexer.setKeywords(0, lang_r.keywords)
    #        self._lexer.setKeywords(1, lang_r.builtins)
    #        self._lexer.supportsFolding = 1
    #    return self._lexer