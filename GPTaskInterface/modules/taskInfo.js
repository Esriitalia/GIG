// author: Roberto Palmieri			version: 05-10-2015
define(["esri/request", "dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred","log/logger!"],
function(esriRequest, declare, lang, Deferred, logger){
	// structure for single task parameter
	function Param(){
		// description:
		//		It represents a single GPTask parameter and the attached progressive number,
		//		used to sort all the input parameters
		var dataType;
		var name;
		var parName;
		var direction;
		var paramType;
		var description;
		var defValue;
		var choiceList;
		var progressiveNum;
	};
	function TLinearUnit(unit,distance){
		// description:
		//		It represents the default value of a LinearUnit parameter
		this.unit=unit;
		this.distance=distance;
	};
	function TFeatureRecordSL(geometryType,spatialReference){
		// description:
		//		It represents the default value of a FeatureSetRecordLayer parameter
		this.geometryType=geometryType;
		this.spatialReference=spatialReference;
		this.hasZ = false;
		this.hasM = false;
		var fields = [];
	};
	function Field(name,type,alias){
		// description:
		//		It represents a single field of a FeatureSetRecordLayer or RecordSet
		this.name = name;
		this.type = type;
		this.alias = alias;
	};
	// deferred: Deferred
	//		Object that manages the asynchronism of dojo request
	var deferred = null;
	return declare(null,{
		// taskUrl: String
		//		GPTask's URL to create the interface
		// taskName: String
		//		Task's name
		// taskExeType: String
		//		Task's execution type, which can be either synchronous (esriExecutionTypeSynchronous)
		//		or asynchronous (esriExecutionTypeAsynchronous)
		// taskDescription: String
		//		Task's description
		// inputParams: Param[]
		//		Array of Param object, that represents the input parameters of the task
		// outputParams: Param[]
		//		Array of Param object, that represents the output parameters of the task
  		taskUrl: null,
  		taskName: null,
  		taskExeType: null,
		taskDescription: null,
		inputParams: null,
		outputParams: null,
		labels: null,
		
		constructor: function(options){
			// summary:
			//		Class that receives the GPTask url and obtains the information about task 
			//    by Services Directory
			// description:
			//		The constructor sets the task url. By this, the requestInfo method retrieves the information
			//		about task, as name, execution type and input parameters. These informations are received in 
			//		json format and the extractInfo method parses them and generates two parameter array
			//    and other variables
			// returns:
			//		The deferred resolve or reject
			this.taskUrl = options.taskUrl || null;
			this.labels = options.labels || null;
			this.extractInfo = lang.hitch(this, this.extractInfo);
			this.reqError = lang.hitch(this, this.reqError);
		},
		
		requestInfo: function(){
			// summary:
			//		Sets and executes the esriRequest to Services Directory
			// description:
			//		Initializes the deferred variable. Then, if the url variable isn't empty, requests
			//		the information by the esri module "esri/request"
			// returns:
			//		"Success" if the request is successful or the error if the request is rejected
			
			this.deferred = new Deferred();
			if(this.taskUrl == null){
				logger.warn('Insert valid URL!');
				return this.deferred.reject(this.labels.invalid_url);
			}
			var request = esriRequest({
				url: this.taskUrl,
				content:{f:"json"},  
          		callbackParamName:"callback",    
          		error:esriConfig.defaults.io.errorHandler,
          		timeout: 10000,
			});
			logger.debug('Start Load Task Info');
			logger.info(this.taskUrl);
			return request.then(this.extractInfo, this.reqError);
		},
		
		extractInfo: function(data) {
			// summary:
			//		Processes the JSON data received and sets the object attribute
			// data: [readonly] JSON
			//		The response of esriRequest
			// description:
			//		Sets the task information in the object's attributes. For each parameter creates
			//		a Param with an appropriate object for the default value 
			// returns:
			//		"Success" if the creation of all parameter is successful or
			//		an error message if at least one parameter is unknown
			// tags:
			//		private, callback
			
			this.inputParams = [];
			this.outputParams = [];
			this.taskName = data.name;
			this.taskExeType = data.executionType;
			this.taskDescription = data.description;
			// progNum: int
			//		Variable that counts the progressive number for input parameters
			var progNum = 0;
			// cycle that for some parameter creates the appropriate object
			for (var i = 0 ; i < data.parameters.length ; i++){
				var p = new Param();
				p.dataType = data.parameters[i].dataType;
				p.name = data.parameters[i].displayName;
				p.parName = data.parameters[i].name;
				p.direction = data.parameters[i].direction;
				p.paramType = data.parameters[i].parameterType;
				p.description = data.parameters[i].description;
				p.defValue = null;
				p.choiceList = null;
				// if is an input parameter, assigns the progressive number and increments it
				if(p.direction == 'esriGPParameterDirectionInput'){
					p.progressiveNum = progNum;
					progNum++;
				}
				// if the choiceList isn't empty, copies it in the Param's attribute
				if(data.parameters[i].choiceList != null){
					if(data.parameters[i].choiceList.length != 0){
						p.choiceList = [];
						p.choiceList = data.parameters[i].choiceList.slice();
					}
				}
				// case with choicelist's lowercase l
				else if(data.parameters[i].choicelist != null){
					if(data.parameters[i].choicelist.length != 0){
						p.choiceList = [];
						p.choiceList = data.parameters[i].choicelist.slice();
					}
				}
				// the structure of the default value is different according to the type of parameter
				if(data.parameters[i].defaultValue != null){
					switch(p.dataType){
						case 'GPBoolean':
						case 'GPLong':
						case 'GPString':
						case 'GPDouble':
						case 'GPDate':
							p.defValue = data.parameters[i].defaultValue;
						break;
						case 'GPLinearUnit':
							p.defValue = new TLinearUnit(data.parameters[i].defaultValue.units,
							   data.parameters[i].defaultValue.distance);
						break;
						case 'GPRecordSet':{
							p.defValue = data.parameters[i].defaultValue;
						}
						break;
						case 'GPFeatureRecordSetLayer':{
							p.defValue = new TFeatureRecordSL();
							if(data.parameters[i].defaultValue.geometryType != null)
								p.defValue.geometryType = data.parameters[i].defaultValue.geometryType;
							if(data.parameters[i].defaultValue.spatialReference != null)
								p.defValue.spatialReference = data.parameters[i].defaultValue.spatialReference.wkid;
							if(data.parameters[i].defaultValue.hasZ != null)
								p.defValue.hasZ = data.parameters[i].defaultValue.hasZ;
							if(data.parameters[i].defaultValue.hasM != null)
								p.defValue.hasM = data.parameters[i].defaultValue.hasM;
								
							if(data.parameters[i].defaultValue.fields != null){
								p.defValue.fields = [];
								for(var j = 0; j < data.parameters[i].defaultValue.fields.length; j++){
									f = new Field(data.parameters[i].defaultValue.fields[j].name,
										data.parameters[i].defaultValue.fields[j].type,
										data.parameters[i].defaultValue.fields[j].alias);
									p.defValue.fields.push(f);
								}
							}
						}
						break;
						// This type can't have the default value;
						case 'GPDataFile':
						case 'GPRasterData':
						case 'GPRasterDataLayer':
							p.defValue = null;
						break;
						case 'GPMultiValue:GPString':{
							if(data.parameters[i].defaultValue.length != 0){
								p.defValue = [];
								p.defValue = data.parameters[i].defaultValue.slice();
							}
						}
						break;
						// if the parameter type is unknown, rejects the request
						default:{
							logger.warn("Unknwon Parameter Number: "+i);
							return this.deferred.reject(this.labels.unknow_param+" "+p.dataType);
						}
						break;
					}
				}
				
				// if is an input parameter, adds it to the appropriate array
				if(p.direction == 'esriGPParameterDirectionInput'){
					if(p.dataType == 'GPRasterData' || p.dataType == 'GPRasterDataLayer'){
						logger.warn("Unmanaged Parameter Number: "+i);
						return this.deferred.reject(this.labels.unmanage_param+" "+p.dataType);
					}
					else
						this.inputParams.push(p);
				}
				// else is an output parameter
				else
					this.outputParams.push(p);
			}
			if(logger.isInfoEnabled()){
				console.log('inputParams', this.inputParams);
				console.log('outputParams', this.outputParams);
			}
			logger.debug('End Load Task Info');
			return this.deferred.resolve("success");	// Deferred
		},
		
		reqError: function(err) {
			// summary:
			//		Receives an error and return it
			// err: [readonly] String
			//		The error response of esriRequest
			// returns:
			//		Deferred reject with an error message
			// tags:
			//		private, callback
				logger.error(err);
       		return this.deferred.reject(err);		// Deferred
        },
  	});
 });