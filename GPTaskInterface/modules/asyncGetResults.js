// author: Roberto Palmieri			version: 23-10-2015
define(["esri/tasks/Geoprocessor","dojo/_base/declare","dojo/_base/array","dojo/_base/lang",
	"dojo/Deferred","dojo/promise/all","log/logger!"], 
function(Geoprocessor, declare, array, lang, Deferred, all, logger){
	return declare(null,{
		// jobId: String
		//		The unique job ID assigned to the current job by ArcGIS Server
		// outputParams: Param[]
		//		The array contains the output parameters of GPTask
		// taskUrl: String
		//		The URL of GPTask
		jobId: null,
		outputParams: null,
		taskUrl: null,
		
		constructor: function(options){
			// summary:
			//		Class that sends a request to the server to get the asynchronous task results 
			// description:
			//		Uses the jobId identifier for recovers the results of asynchronous GPTask from the server
			// returns:
			//		An array contains the results
			this.jobId = options.jobId || null;
			this.outputParams = options.outputParams || null;
			this.taskUrl = options.taskUrl || null;
			this.loadResult = lang.hitch(this, this.loadResult);
		},
		
		getResults: function(){
			// summary:
			//		Manages the requests to the server to get results
			// description:
			//		Instantiates a multiple promise (promise all) using an array of request to the server,
			//		for recovering all the GPTask results
			// returns:
			//		An array contains the results
			var def = new Deferred();
			var gp = new Geoprocessor(this.taskUrl);
			var defResults = [];
			for(var i=0; i< this.outputParams.length; i++){
				defResults.push(this.loadResult(gp, this.jobId, this.outputParams[i].parName));
			}
			logger.debug('Start Async Get Results');
			all(defResults).then(function(results){
				return def.resolve(results);
			});
			logger.debug('End Async Get Results');
			return def.promise;
		},

		loadResult: function(gp, jobId, parameter){
			// summary:
			//		A single request to get a specific result to the server 
			// gp: Geoprocessor Task
			//		The object that manages the request to the server
			// jobId: String
			//		The unique job ID assigned to the current job by ArcGIS Server
			// parameter: String
			//		The name of the result parameter that must be recovered
			// returns:
			//		The recovered result
			// tags:
			//		private
			var deferred = new Deferred();
			gp.getResultData(this.jobId, parameter, function(result,messages){
				return deferred.resolve(result);	
			});
			return deferred.promise;
		}
	});
});