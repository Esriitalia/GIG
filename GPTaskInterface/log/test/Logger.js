define(["doh/main", "log/main", "log/logger!", "log/logger!testLoggerName", "module"], function (doh, logFactory, logger, testLogger, module) {
  doh.register("tests.log.logger", [
    {
      // module level in boot
      // injected with has["logLevel-log.test.test-logger"] = "TRACE";
      name: "TEST[Logger]",
      runTest: function (t) {
        t.assertTrue(logger != null);
        // level test via has
        t.assertEqual(logFactory.getInitialLogLevelFor(logger.name), "TRACE");
        // module test logger module should be the same as current module
        t.assertEqual(logFactory.loggerName2Mid(logger.name), module.id);
      }
    },
    {
      name: "TEST[Logger with ID injected via plugin]",
      runTest: function(t) {
        t.assertTrue(testLogger != null);
        t.assertEqual("WARN", testLogger.getLevel());
        t.assertEqual("testLoggerName", testLogger.name);
      }
    }
  ])
  ;
});