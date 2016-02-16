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
define(["./LogglyAppender", "dojo/_base/kernel", "./main"
       ],// "https://d3eyf2cx8mbems.cloudfront.net/js/loggly-0.2.1.js"
  function(LogglyAppender, kernel, log4javascript) {

    //noinspection JSUnresolvedVariable
    var loggly = kernel.global.loggly;
    //noinspection JSUnresolvedVariable
    delete kernel.global.loggly;

    var layout = new log4javascript.PatternLayout("%d{dd MMM yyyy HH:mm:ss,SSS} %-5p - %f - %c - %m");

    var LogglyImgAppender = function(logglyKey) {
      // summary:
      //   This log appender logs to a Loggly account with the given key,
      //   using the "standard" way offered by Loggly, "castor", which is via an img tag.
      //   The script provided by Loggly is used, straight from the source.
      //   Levels are mapped (castor does not have a FATAL level).

      LogglyAppender.call(this, logglyKey);
      //noinspection JSUnresolvedVariable
      this.castor = new loggly.castor({url: "https://http-logs.loggly.com/inputs/" + this.key, level: "log"});
    };

//    https://http-logs.loggly.com/inputs/<guid>.gif?key=value&anotherkey=anothervalue

    LogglyImgAppender.prototype = new LogglyAppender();

    LogglyImgAppender.prototype.setLayout(layout);

    LogglyImgAppender.prototype.send2Loggly = function(/*log4javascript.Level*/ level, /*Object*/ formattedMsg) {
      if (log4javascript.Level.TRACE.isGreaterOrEqual(level)) {
        this.castor.log(formattedMsg);
      }
      else if (log4javascript.Level.DEBUG.equals(level)) {
        this.castor.debug(formattedMsg);
      }
      else if (log4javascript.Level.INFO.equals(level)) {
        this.castor.info(formattedMsg);
      }
      else if (log4javascript.Level.WARN.equals(level)) {
        this.castor.warn(formattedMsg);
      }
      else if (level.isGreaterOrEqual(log4javascript.Level.ERROR)) {
        this.castor.error(formattedMsg);
      }
    };

    LogglyImgAppender.prototype.toString = function() {
      return "LogglyImgAppender";
    };

    return LogglyImgAppender;
  }
);
