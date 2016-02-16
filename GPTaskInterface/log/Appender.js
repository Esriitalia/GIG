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
define(["dojo/_base/declare", "./main"],
  function(declare, log4javascript) {

    // runId: Number
    //   random number to identify a page app instance run
    var runId = Math.floor(Math.random() * 9007199254740992);

    var Appender = declare([log4javascript.Appender], {
      // summary:
      //   Extended super class for Appenders.
      //   We add a custom field "run" that contains a random number to identify a page app instance run
      //   to each added layout.

      setLayout: function(/*log4javascript.Layout*/ layout) {
        layout.setCustomField("run", runId);
        this.inherited(arguments);
      }

    });

    return Appender;
  }
);
