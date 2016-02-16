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
define(["./main"],
  function(log4javascript) {

    var LogglyAppender = function(/*String*/ logglyKey) {
      // summary:
      //   This is a prototype for a log appender that logs to a Loggly account with the given key.
      //   Levels are mapped to the levels supported by loggly/castor.
      //   A custom field "run", which is a large random number to indentify a page app instance run,
      //   is added to each layout.

      this.key = logglyKey;
    };

    LogglyAppender.prototype = new log4javascript.Appender();

    LogglyAppender.prototype.setLayout = function(/*log4javascript.Layout*/ layout) {
      layout.setCustomField("run", Math.floor(Math.random() * 9007199254740992)); // random number to identify a page app instance run
      return log4javascript.Appender.prototype.setLayout.apply(this, arguments);
    };

    LogglyAppender.prototype.send2Loggly = function(/*log4javascript.Level*/ level, /*Object*/ formattedMsg) {
      // ABSTRACT
    };

    LogglyAppender.prototype.append = function(loggingEvent) {
      var layout = this.getLayout();
      var formattedMessage = layout.format(loggingEvent);
      if (layout.ignoresThrowable() && loggingEvent.exception) {
        formattedMessage += loggingEvent.getThrowableStrRep();
      }
      if (log4javascript.Level.TRACE.isGreaterOrEqual(loggingEvent.level)) {
        this.send2Loggly(log4javascript.Level.TRACE, formattedMessage);
      }
      else if (loggingEvent.level.isGreaterOrEqual(log4javascript.Level.ERROR)) {
        this.send2Loggly(log4javascript.Level.ERROR, formattedMessage);
      }
      else {
        this.send2Loggly(loggingEvent.level, formattedMessage);
      }
    };

    LogglyAppender.prototype.toString = function() {
      return "LogglyAppender";
    };

    return LogglyAppender;
  }
);
