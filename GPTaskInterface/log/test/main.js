define(["doh/main", "log/main"], function (doh, logFactory) {
  doh.register("tests.log.main", [
    {
      // has["logLevel-test.log.main_INFO"] = "INFO";
      name: "TEST[main] getInitialLogLevelFor",
      runTest: function (t) {
        var d = new doh.Deferred();
        var logger = logFactory.getLogger("test.log.main_INFO");
        setTimeout(d.getTestCallback(function () {
          t.assertEqual(logFactory.getInitialLogLevelFor(logger.name), "INFO");
        }), 500);
        return d;
      }
    },
    {
      // has["logLevel-test.log.main_DEBUG"] = "DEBUG";
      name: "TEST[main] loggerName2Mid",
      runTest: function (t) {
        var d = new doh.Deferred();
        var logger = logFactory.getLogger("test.log.main_DEBUG");
        setTimeout(d.getTestCallback(function () {
          t.assertEqual(logFactory.loggerName2Mid(logger.name), "test/log/main_DEBUG");
        }), 500);
        return d;
      }
    },
    {
      // has["logLevel-test.log.main_TRACE"] = "TRACE";
      name: "TEST[main] mid2LoggerName",
      runTest: function (t) {
        var d = new doh.Deferred();
        var logger = logFactory.getLogger("test.log.main_TRACE");
        setTimeout(d.getTestCallback(function () {
          t.assertEqual(logFactory.mid2LoggerName("test/log/main_TRACE"), logger.name);
        }), 500);
        return d;
      }
    }
  ]);
});

