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
define(["dojo/_base/kernel", "dojo/has", "dojo/io-query", "module", "./_base/log4javascript_uncompressed"],
    function (kernel, has, ioQuery, module) {
        // summary:
        //   This collection of modules makes log4javascript available in Dojo.
        //   This module returns the log4javascript object, and does some initialisation.
        // description:
        //   We use the uncompressed version of log4javascript. A dojo build will do the compression
        //   if necessary.
        //   The standard log4javascript code is loaded, and returned as this module. It is removed
        //   from window.
        //
        //   By default, we add a BrowserConsoleAppender with a nice layout. The default
        //   logging level is INFO.
        //
        //   We advise to have a logger per module, with as name the mid of the module, with "/"
        //   replaced by ".".

        function loggerName2Mid(loggerName) {
            return loggerName.replace(/\./g, "/");
        }

        function mid2LoggerName(mid) {
            return mid.replace(/\//g, ".");
        }

        function getInitialLogLevelFor(mid) {
            // summary:
            //   Initial logging levels are read from dojo config and the location URL. We look for a
            //   has-property or URL query parameter with name `"loglevel-" + mid` (with "/" separators, not ".").
            //   The value should be "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", or "OFF" or anything else.
            //   If no entry is found, we return null. This should mean that we want to use the default of the
            //   parent logger. If any other value is found, we return "OFF". This means we don't want any logging.
            //
            //   The URL query parameters have precedence over the has-setting.

            var paramName = "logLevel-" + mid;
            var searchArguments = ioQuery.queryToObject(window.location.search.substring(1)); // window.location.search contains "?"
            var levelName = searchArguments[paramName] || has(paramName);
            var level = levelName ? (log4javascript.Level[levelName] || "OFF") : null;
            return level;
        }

        //noinspection JSUnresolvedVariable
        var log4javascript = kernel.global.log4javascript;
        //noinspection JSUnresolvedVariable
        delete kernel.global.log4javascript;

        log4javascript.mid = module.id;
        log4javascript.loggerName2Mid = loggerName2Mid;
        log4javascript.mid2LoggerName = mid2LoggerName;
        log4javascript.getInitialLogLevelFor = getInitialLogLevelFor;

        var originalGetLogger = log4javascript.getLogger;
        log4javascript.getLogger = function (loggerName) {
            var initialLogLevel = getInitialLogLevelFor(loggerName);
            var resultLogger = originalGetLogger(loggerName);
            if (initialLogLevel) {
                resultLogger.setLevel(initialLogLevel);
            }
            return resultLogger;
        };
        var rootLogger = log4javascript.getRootLogger();
        var layout = new log4javascript.PatternLayout("%d{HH:mm:ss,SSS} %-5p - %c - %m");
        var consoleAppender = new log4javascript.BrowserConsoleAppender();
        consoleAppender.setThreshold(log4javascript.Level.ALL);
        consoleAppender.setLayout(layout);
        rootLogger.addAppender(consoleAppender);
        rootLogger.setLevel(log4javascript.Level.INFO);

        return log4javascript;
    });
