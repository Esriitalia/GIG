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
define(["dojo/_base/declare", "./Appender", "dojo/io-query", "./_base/js"],
  function(declare, Appender, ioQuery, js) {

    // logglyBaseUrl: String
    var logglyBaseUrl = "https://http-logs.loggly.com/inputs/";
    // https://http-logs.loggly.com/inputs/<guid>.gif?key=value&anotherkey=anothervalue

    function messageToParams(message) {
      var result;
      //noinspection FallthroughInSwitchStatementJS
      switch (js.typeOf(message)) {
        case "undefined":
        case "null":
        case "number":
        case "boolean":
        case "string":
        case "date":
          result = {PLAINTEXT: JSON.stringify(message)};
          break;
        case "regexp":
        case "math":
        case "json":
          result = {PLAINTEXT: message.toString()};
          break;
        case "array":
        case "arguments":
          var composition = []; // can't use reduce because arguments does not support it
          for (var i = 0; i < message.length; i++) {
            composition.push(JSON.stringify(message[i]));
          }
          result = {PLAINTEXT: composition.join(",")};
          break;
        default: // object, error
          result = message;
      }
      result.DT = Date(); // without new, this return a String representation of now
      return result;
    }

    var LogglyImgAppender = declare([Appender], {
      // summary:
      //   This log appender logs to a Loggly account with the given key.
      //   We don't use the supplied "castor" script, but do it on our own.
      //   This appender still uses the "img" tag.
      //   The standard log4javascript levels are used.

      // _url: String
      //   base url to log to
      _url: null,

      constructor: function(/*String*/ logglyKey) {
        // logglyKey
        //   Loggly supplied account identification key.

        this._url = logglyBaseUrl + logglyKey + ".gif?";
      },

      append: function(/*log4javascript.LoggingEvent*/ loggingEvent) {
        var layout = this.getLayout();
        var formattedMessage = layout.format(loggingEvent);
        var src = this._url + ioQuery.objectToQuery(messageToParams(formattedMessage));

        var img = document.createElement("img");
        img.src = this._url + ioQuery.objectToQuery(messageToParams(formattedMessage));
      }
    });

    return LogglyImgAppender;
  }
);
