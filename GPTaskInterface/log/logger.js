/*
 Copyright 2013 by PeopleWare n.v.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
define(["./main", "module"],
  function(log4javascript, module) {

    var plugin = {
      // summary:
      //   This plugin returns a Logger for the module in which it is called.
      //   | define(["ppwcode-util-oddsAndEnds/log/logger!#"]
      //   At least one character (any character) is needed after "!". It is not used, but otherwise
      //   the loader function is not triggered.
      //
      //   The initial logging level is defined in dojoConfig or the URL query.
      //   See `./main.getInitialLogLevelFor`.

      mid: module.id,

      // dynamic: boolean
      //   Undocumented feature.
      //   Without this, plugin calls with the same text after "!" (id) are only called once.
      dynamic: true,

      load: function(/*String*/ id,       // the string to the right of the !; not used
                     require,             // AMD require; usually a context-sensitive require bound to the module making the plugin request
                     /*Function*/ done) { // the function the plugin should call with the return value once it is done
        var mid = require.module.mid; // the mid of the calling module
        var loggerIdToLookup = id !== null && id !== "" ? id : mid;
        var logger = log4javascript.getLogger(log4javascript.mid2LoggerName(loggerIdToLookup));
        var initialLevel = log4javascript.getInitialLogLevelFor(loggerIdToLookup);
        if (initialLevel) {
          logger.setLevel(initialLevel); // cannot set null
        }
        done(logger);
      }

    };

    return plugin;
  }
);
