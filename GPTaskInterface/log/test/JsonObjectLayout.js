define(["doh/main", "dojo/_base/array", "log/main", "log/Appender", "log/JsonObjectLayout"], function (doh, array, logFactory, Appender, JsonObjectLayout) {
  doh.register("tests.log.JsonObjectLayout", [
    {
      name: "TEST[JsonObjectLayout] format",
      runTest: function (t) {
        var loggingEvent = new logFactory.LoggingEvent(this, new Date(), logFactory.Level.ERROR, ["testing message"], null);
        var jsonObjectLayout = new JsonObjectLayout();
        var result = jsonObjectLayout.format(loggingEvent);
        t.assertTrue(result);
        t.assertTrue(result.level === "ERROR");
        t.assertTrue(result.logger === "TEST[JsonObjectLayout] format");
        t.assertTrue(result.message && result.message.length === 1);
        t.assertTrue(result.message[0] === "testing message");
        t.assertTrue(result.timestamp);
      }
    }
  ]);
});