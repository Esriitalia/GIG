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
    function (log4javascript) {

        var sessionId = Math.floor(Math.random() * 9007199254740992); // random number to identify a page app instance run

        var layout = new log4javascript.JsonLayout(false, false);
        layout.setCustomField("logger", function (layout, loggingEvent) {
            return loggingEvent.logger.name;
        });

        function logglyAjaxAppenderFactory(logglyKey) {
            // summary:
            //   A factory for log4javascript.AjaxAppenders talking JSON to Loggly.
            // description:
            //   We do not extend LogglyAppender, since we do not have multiple inheritance here,
            //   and there is little to gain. We cannot extend AjaxAppender, since it is implemented
            //   with a non-null parameter url.

            var instance = new log4javascript.AjaxAppender("http://logs-01.loggly.com/inputs/" + logglyKey + "/");
            instance.setLayout(layout);
            instance.addHeader("Access-Control-Allow-Origin", "http://localhost:8180/");
            instance.addHeader("Content-type" , "application/json");

//            instance.getXmlHttp = function (obj) {
//                return new XMLHttpRequest();
//            }
            instance.setSessionId(sessionId);
            instance.setSendAllOnUnload(true);
            instance.toString = function () {
                return "LogglyAjaxAppender";
            };
            return instance;
        }

        return logglyAjaxAppenderFactory;
    }
);
