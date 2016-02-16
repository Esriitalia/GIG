define(["doh/main", "dojo/_base/array", "log/main", "log/Appender"], function (doh, array, logFactory, Appender) {
  doh.register("tests.log.appender", [
    {
      name: "TEST[Appender] setLayout",
      runTest: function (t) {
        var sl = new logFactory.SimpleLayout();
        var appender = new Appender();
        // set layout custom field "run"
        appender.setLayout(sl);
        function hasCustomFiled(/*array*/ customFields) {
          return array.some(customFields, function(field){
            return field.name == "run"; });
        }
        t.assertTrue(sl.customFields.length > 0);
        t.assertTrue(hasCustomFiled(sl.customFields));
      }
    }
  ])
  ;
});