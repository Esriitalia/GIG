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

    var JsonObjectLayout = declare([log4javascript.Layout], {
      // summary:
      //   A JSON layout that actually returns an object, and does not try to stringify it itself.
      //   When requested to format multiple messages, we return an Array

      constructor: function() {
        this.setKeys();
        this.customFields = [];
      },

      format: function(loggingEvent) {
        var /*String[][]*/ dataValues = this.getDataValues(loggingEvent, this.combineMessages);
        var result = dataValues.reduce( // change Array to Object
          function(acc, entry) {
            acc[entry[0]] = entry[1];
            return acc;
          },
          {}
        );
        return result;
      },

      ignoresThrowable: function() {
        return false;
      },

      toString: function() {
        return "JsonObjectLayout";
      },

      getContentType: function() {
        return "application/json";
      }

    });

    return JsonObjectLayout;
  }
);
