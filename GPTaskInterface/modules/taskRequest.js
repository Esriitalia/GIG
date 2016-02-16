// author: Roberto Palmieri			version: 14-11-2015
define(["esri/tasks/FeatureSet","esri/tasks/LinearUnit","esri/tasks/DataFile","esri/graphic",
	"esri/layers/GraphicsLayer","esri/tasks/Geoprocessor","esri/Color","esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleLineSymbol","esri/symbols/SimpleFillSymbol",
	"dojo/_base/declare","dojo/_base/lang","dojo/dom","dojo/dom-attr","dojo/dom-construct","dojo/Deferred",
	"dijit/Dialog","log/logger!"], 
function(FeatureSet, LinearUnit, DataFile, Graphic, GraphicsLayer, Geoprocessor, Color, 
	SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, declare, lang, dom, domAttr, domCost, Deferred,
	Dialog, logger){
	// deferred: Deferred
	//		Object that manages the request's asynchronism
	var deferred = null;
	return declare(null,{
		// taskUrl: String
		//		Task's URL to execute the request
		// taskExeType: String
		//		Task's execution type, which can be either synchronous (esriExecutionTypeSynchronous)
		//		or asynchronous (esriExecutionTypeAsynchronous)
		// parameters: Param[]
		//		Array of Param object, that contains the input parameters of the task
		// inputFeature: Graphic []
		//		variable that will contains all GPFeatureRecordSetLayer parameters
		// labels: [readonly] Object
		//		Contains the labels in the current language
		taskUrl: null,
		taskExeType: null,
		parameters: null,
		inputFeature: null,
		labels: null,
		constructor: function(options){
			// summary:
			//		Class that reads the input parameters and runs the geoprocessing task
			// description:
			//		Creates the json parameters object with the values inserted by the user,
			//		then executes the geoprocessing task with them
			// returns:
			//		The deferred resolve or reject
			this.taskUrl = options.taskUrl || null;
			this.taskExeType = options.taskExeType || null;
			this.parameters = options.parameters || null;
			this.labels = options.labels || null;
			// the hitch function allows to execute the functions in a given context (used in async operations)
			this.readInput = lang.hitch(this, this.readInput);
			this.syncError = lang.hitch(this, this.syncError);
			this.syncResults = lang.hitch(this, this.syncResults);
			this.asyncComplete = lang.hitch(this, this.asyncComplete);
			this.asyncError = lang.hitch(this, this.asyncError);
		},
		
		gpTaskRequest: function(map){
			// summary:
			//		Receives by readInput method the object contains the input parameters and sends 
			//		the request to the server.
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			// description:
			//		Initializes the geoprocessor object and, after receiving the input parameters,
			//		sends a synchronous or asynchronous request
			// returns:
			//		The results of GP Task
			this.deferred = new Deferred();
			var gp = new Geoprocessor(this.taskUrl);
			// settings the output spatial reference
			if(dom.byId('outputSR').value != ''){
				gp.setOutSpatialReference({
	      			wkid: dom.byId('outputSR').value
	    		});
			}
			// settings the process spatial reference
			if(dom.byId('processSR').value != ''){
				gp.setOutSpatialReference({
	      			wkid: dom.byId('processSR').value
	    		});
			}
			this.inputFeature = [];
			// Array that receives the user input parameters by the readInput method
    		var inputParam = this.readInput();
    		// If the inputParam receives a string, this contains an error message
    		if(typeof (inputParam) == 'string'){
    			this.deferred.reject(inputParam);
    			return this.deferred.promise;
    		}
    		// before submit the request, redraws all the features
    		this.redrawInputFeature(this.inputFeature, map);
    		if(logger.isInfoEnabled())
    			console.log("requestParam",inputParam);
    		// if the task execution type is asynchronous, uses the 'submit job' method
    		if(this.taskExeType == 'esriExecutionTypeAsynchronous'){
    			logger.debug('Start Async task execution');
    			gp.setUpdateDelay(200);
    			gp.submitJob(inputParam,this.asyncComplete,this.asyncStatus,this.asyncError);
    			domCost.destroy('servError');
    		}
    		// else if the task execution type is synchronous, uses the 'execute' method
    		else if(this.taskExeType == 'esriExecutionTypeSynchronous'){
    			logger.debug('Start Sync task execution');
    			gp.execute(inputParam,this.syncResults,this.syncError);
    			domCost.destroy('servError');
    		}
    		map.graphics.clear();
    		return this.deferred.promise;
		},
		
		syncError: function(error){
			// summary:
			//		The method to call if an error occurs on the synchronous GP task
			// error: String
			//		The string that identifies the error occurred
			// returns:
			//		The deferred rejection
			// tags:
			//		private
			logger.warn('An error is occured during task execution ', error);
			var errMessage = this.labels.execute_err+':<br>'+error;
			return this.deferred.reject(errMessage);
		},
		asyncError: function(error){
			// summary:
			//		The method to call if an error occurs on the asynchronous GP task
			// error: String
			//		The string that identifies the error occurred
			// returns:
			//		The error message
			// tags:
			//		private
			logger.warn('An error is occured during task execution ', error);
			var errMessage = this.labels.execute_err+':<br>'+error;
			return this.deferred.reject(errMessage);
		},
		asyncStatus: function(jobInfo){
			// summary:
			//		The method called for checks the current status of the job
			// jobInfo: Object
			//		Contains the jobId, the jobStatus and any messages
			// tags:
			//		private
			if(logger.isDebugEnabled())
				console.log('Executing...');
		},
		asyncComplete: function(jobInfo){
			// summary:
			//		The method to call when the GP Task is completed
			// jobInfo: Object
			//		Contains the jobId, the jobStatus and any messages
			// returns:
			//		If the job status is success returns the job id,
			//		else returns the error message
			// tags:
			//		private
			if(jobInfo.jobStatus == 'esriJobSucceeded'){
				var response = {
					type: 'async',
					jobId: jobInfo.jobId,
				};
				logger.debug('End Async task execution');
				return this.deferred.resolve(response);
			}
			else{
				logger.warn('An error is occured during task execution');
				return this.deferred.reject(jobInfo.jobStatus);
			}
			
		},
		syncResults: function(results,messages){
			// summary:
			//		The method to call when the GP Task is completed
			// results: [Object]
			//		Contains the responses of the GP Task
			// messages: [String]
			//		Contains the messages of the GP Task
			// returns:
			//		The response of GP Task
			// tags:
			//		private
			var response = {
				type: 'sync',
				messages: messages,
				results: results,
			};
			logger.debug('End Sync task execution');
			return this.deferred.resolve(response);
		},
		
		readInput: function(){
			// summary:
			//		Recovers the user input and generates an appropriate object contains 
			//		the input parameters for GP Task
			// description:
			//		For each html fieldset recovers the input choosed by the user 
			//		and according to the parameter type
			//		inserts it in inputParams JSON structure
			// returns:
			//		The JSON structure contains the input parameter
			// tags:
			//		private
			logger.debug('Start Read Input');
			var inputParams = {};
			for(var i = 0; i < this.parameters.length; i++){
				var fieldDisableAttr = domAttr.get('field'+i,'disabled');
				// if the fieldset isn't disable
				if(fieldDisableAttr != true){
					switch(this.parameters[i].dataType){
						case 'GPString':
						case 'GPLong':
						case 'GPDouble':{
							var node = 'param'+i+'val0';
							var parName = this.parameters[i].parName;
							var nodeName = domAttr.get(dom.byId(node),"name");
							var p = null;
							// if GPString parameter has a choiceList's length less than 7 items
							if(nodeName == 'radio'){
								p = this.findRadioCheck(i);
							}
							else if(dom.byId(node).value != '')
									p = dom.byId(node).value;
							if(this.parameters[i].dataType == 'GPString')
								inputParams[parName] = p;
							else
								inputParams[parName] = parseFloat(p);
						}
						break;
						case 'GPFeatureRecordSetLayer':{
							// the featureRecordSetLayer field's id 
							var FRSL = domAttr.get('field'+i,'name');
							// extracts the geometry type [GeoPoint, GeoMulPo, GeoPolyl, GeoPolyg]
							var geoType = FRSL.substr(0,8);
							var parName = this.parameters[i].parName;
							var features = [];
							
							switch(geoType){
								case 'GeoPoint':
									geoType = 'point';
								break;
								case 'GeoMulPo':
									geoType = 'multipoint';
								break;
								case 'GeoPolyl':
									geoType = 'polyline';
								break;
								case 'GeoPolyg':
									geoType = 'polygon';
								break;
							}
							
							try{
								var parameter = JSON.parse(dom.byId('param'+i+'val0').value);
								for(var j=0; j < parameter.features.length; j++){
									// if at least one geometry type is wrong, returns an error
									if(parameter.features[j].geometry.type != geoType){
										var dialog = new Dialog({
										   title: "Feature Error",
										   content: "FeatureRecordSetLayer Syntax Error - "+this.labels.wrong_geom+
										   " "+this.parameters[i].name,
							            style: "width: 300px;"
										});
										dialog.show();
										logger.warn('Wrong feature geometry');
										return "FeatureRecordSetLayer Syntax Error - "+this.labels.wrong_geom+
										   " "+this.parameters[i].name;
									}
									var graphic = new Graphic(parameter.features[j]);
									features.push(graphic);
								}
							}catch(e){
								var dialog = new Dialog({
								   title: "Feature Error",
								   content: "FeatureRecordSetLayer Syntax Error <br> Parameter:"+
								   	this.parameters[i].name,
					            style: "width: 300px;"
								});
								dialog.show();
								return 'FeatureRecordSetLayer syntax error - '+this.parameters[i].name;
							}
							
							var featureSet = new FeatureSet();
							featureSet.features = features;
							inputParams[parName] = featureSet;
							var featureInfo = {
								graphicsLayerId: 'param'+this.parameters[i].progressiveNum,
								featureSet: featureSet
							};
							this.inputFeature.push(featureInfo);
						}
						break;
						case 'GPBoolean':{
							var node = 'param'+i+'val0';
							var parName = this.parameters[i].parName;
							var nodeName = domAttr.get(dom.byId(node),"name");
							var p = this.findRadioCheck(i);
							inputParams[parName] = p;
						}
						break;
						case 'GPLinearUnit':{
							var parName = this.parameters[i].parName;
							var par = new LinearUnit();
							// verifies if the distance field is empty
							if((dom.byId('param'+i+'val0').value != '')){
								par.distance = parseFloat(dom.byId('param'+i+'val0').value);
								par.units = 'esri'+dom.byId('param'+i+'val1').value;
								inputParams[parName] = par;
							}
							else
								inputParams[parName] = null;
							
						}
						break;
						case 'GPDate':{
							// parses the datetime-local value on a number
							var parName = this.parameters[i].parName;
							var par = Date.parse(dom.byId('param'+i+'val0').value);
							// if the input type datetime-local is not supported (IE11, Firefox 42)
							if(isNaN(par)){
								par = dom.byId('param'+i+'val0').value;
								// if the value is not included
								if(par == ''){
									var dialog = new Dialog({
									   title: "Error",
									   content: "GPDate Syntax Error",
						            style: "width: 300px;"
									});
									dialog.show();
									logger.warn('GPDate Syntax Error');
									return 'GPDate Syntax error - '+this.parameters[i].name;
								}
								par = parseInt(par);
							}
							inputParams[parName] = par;
						}
						break;
						case 'GPMultiValue:GPString':{
							var parName = this.parameters[i].parName;
							var par = [];
							var fieldName = domAttr.get('field'+i,'name');
							var fieldNum = fieldName.substr(10);
							fieldName = fieldName.substr(0,8);
							// if a parameter has a choiceList
							if(fieldName == 'numCheck'){
								for(var j=0; j < fieldNum; j++){
									if(dom.byId('param'+i+'check'+j).checked)
										par.push(dom.byId('param'+i+'check'+j).value);
								}
							}
							else{
								for (var j=0; j < fieldNum; j++){
									if(dom.byId('param'+i+'val'+j).value != '')
										par.push(dom.byId('param'+i+'val'+j).value);
								}
							}
							if(par.length != 0)
								inputParams[parName] = par;
							else
								inputParams[parName] = null;
						}
						break;
						case 'GPRecordSet':{
							var parName = this.parameters[i].parName;
							var features = [];
							
							try{
								var parameter = JSON.parse(dom.byId('param'+i+'val0').value);
								for(var j=0; j < parameter.features.length; j++){
									var graphic = new Graphic(parameter.features[j]);
									features.push(graphic);
								}
							}catch(e){
								var dialog = new Dialog({
								   title: "RecordSet Error",
								   content: "GPRecordSet Syntax Error",
					            style: "width: 300px;"
								});
								dialog.show();
								logger.warn('GPRecordSet Syntax error');
								return 'GPRecordSet syntax error - '+this.parameters[i].name;
							}
							var featureSet = new FeatureSet();
							featureSet.features = features;
							inputParams[parName] = featureSet;
						}
						break;
						case 'GPDataFile':{
							var parName = this.parameters[i].parName;
							var dataFile = new DataFile();
							dataFile.url = dom.byId('param'+i+'val0').value;
							inputParams[parName] = dataFile;
						}
						break;
					}
				}
			}
			logger.debug('End Read Input');
			return inputParams;
		},
		findRadioCheck: function(i){
			// summary:
			//		Finds the radio button checked by the user
			// i: integer
			//		The number of the examined input parameter
			// returns:
			//		The value of the user choice 
			// tags:
			//		private
			var j = 0;
			var value = null;
			var radioBut = 'param'+i+'val0check'+j;
			while(dom.byId(radioBut)){
				if(dom.byId(radioBut).checked){
					value = dom.byId(radioBut).value;
					break;
				}
				else{
					j++;
					radioBut = 'param'+i+'val0check'+j;
				}
			}
			return value;
		},
		redrawInputFeature: function(featureInfo, map){
			// summary:
			//		Redraws all the features
			// featureInfo: Object []
			//		Object array contains for each object a feature and the respective layer id
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			// tags:
			//		private
			
			// Removes all drawn features
			var graphicsLayers = map.graphicsLayerIds;
			for(var i=0; i < graphicsLayers.length; i++){
				var graLayer = map.getLayer(graphicsLayers[i]);
				graLayer.clear();
			}
			// Draws on the map all the features input parameter
			for(var i=0; i < featureInfo.length; i++){
				var parameterLayer = map.getLayer(featureInfo[i].graphicsLayerId);
				for(var j=0; j < featureInfo[i].featureSet.features.length; j++){
					var symbol = null;
					if(featureInfo[i].featureSet.features[j].geometry.type == 'point' ||
						featureInfo[i].featureSet.features[j].geometry.type == 'multipoint'){
						symbol = new SimpleMarkerSymbol();
						symbol.setSize(25);
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 1));
						symbol.setColor(new Color([0,255,128,0.35]));
					}
					else if(featureInfo[i].featureSet.features[j].geometry.type == 'polyline'){
						symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,255,128,0.45]), 4);
					}
					else if(featureInfo[i].featureSet.features[j].geometry.type == 'polygon'){
						symbol = new SimpleFillSymbol();
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 2));
			            symbol.setColor(new Color([0,255,128,0.25]));
					}
					var graphic = new Graphic(featureInfo[i].featureSet.features[j].geometry,symbol);
					parameterLayer.add(graphic);
				}
			}
		}
	});
});
