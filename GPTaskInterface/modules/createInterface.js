// author: Roberto Palmieri			version: 02-11-2015
define(["esri/toolbars/draw","esri/tasks/FeatureSet", "esri/graphic","esri/graphicsUtils",
   "esri/layers/GraphicsLayer","esri/Color","esri/symbols/SimpleMarkerSymbol",
   "esri/symbols/SimpleLineSymbol","esri/symbols/SimpleFillSymbol",
   "dojo/_base/declare","dojo/dom","dojo/on","dojo/dom-attr","dojo/dom-style","dojo/query",
   "dojo/dom-construct","dijit/Dialog","log/logger!","dojo/domReady!"],
function(Draw, FeatureSet, Graphic, graphicsUtils, GraphicsLayer, Color, SimpleMarkerSymbol,
   SimpleLineSymbol, SimpleFillSymbol, declare, dom, on, domAttr, domStyle, query, domCost, Dialog, logger){
	return declare(null,{
		// taskUrl: String
		//		Task's URL to create the interface
		// taskName: String
		//		Task's name
		// taskExeType: String
		//		Task's execution type, which can be either synchronous (esriExecutionTypeSynchronous)
		//		or asynchronous (esriExecutionTypeAsynchronous)
		// taskDescription: String
		//		Task's description
		// inputParams: Param[]
		//		Array of Param object, that contains the input parameters of the task
		// labels: [readonly] Object
		//		Contains the labels in the current language
		taskUrl: null,
  		taskName: null,
  		taskExeType: null,
		taskDescription: null,
		inputParams: null,
		labels: null,
		constructor: function(options){
			// summary:
			//		Class that receives the GPTask information and creates an appropriate user interface
			// description:
			//		The constructor sets the task information, excluded the output parameter. The loadInterface
			//		method, using this information, shows the GPTask properties and generates an input interface
			//		for each input parameter
			// returns:
			//		The number of input parameters
			this.taskUrl = options.taskUrl || null;
			this.taskName = options.taskName || null;
			this.taskExeType = options.taskExeType || null;
			this.taskDescription = options.taskDescription || null;
			this.inputParams = options.inputParams || null;
			this.labels = options.labels || null;
		},

		loadInterface: function(map, divInputPar){
			// summary:
			//		Processes the received information and generates the user interface
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics
			//    and other map controls
			// divInputPar: [readonly] String
			//		The div id used for shows the user interface
			// description:
			//		Generates the html5 code for showing the task's general information and for each
			//		input parameter retrieves the appropriate method to shows the input interface
			// returns:
			//		The number of input parameters
			var htmlCode = null;
			logger.debug('Start create interface');
			
			domCost.empty(divInputPar);
			// Shows the general information about the task
			htmlCode = '<b>'+this.labels.task_name+'</b> ' +this.taskName+'<br>';
			htmlCode += '<b>'+this.labels.exe_type+'</b> '+this.taskExeType+'<br>';
			htmlCode += '<b>'+this.labels.task_desc+'</b> '+this.taskDescription+'<br>';
			htmlCode += '<a href="'+dom.byId("url").value+'" target="_blank"> <b>Task URL</b></a><br><br>';
			htmlCode = domCost.toDom(htmlCode);
			domCost.place(htmlCode,divInputPar,"first");
			// for each input parameter type retrieves the appropriate method
			for (var i = 0 ; i < this.inputParams.length ; i++){
				// retrieves the method that creates the layout that contains a single parameter
				this.InitParamField(divInputPar, this.inputParams[i].dataType, this.inputParams[i].name,
				   this.inputParams[i].description, this.inputParams[i].progressiveNum,
				   this.inputParams[i].paramType);
				switch(this.inputParams[i].dataType){
					case 'GPString':
						this.GPStringInter(this.inputParams[i]);
					break;
					case 'GPBoolean':
						this.GPBooleanInter(this.inputParams[i]);
					break;
					case 'GPLong':
					case 'GPDouble':
						this.GPDoubLongInter(this.inputParams[i]);
					break;
					case 'GPLinearUnit':
						this.GPLinUnitInter(this.inputParams[i]);
					break;
					case 'GPDate':
						this.GPDateInter(this.inputParams[i]);
					break;
					case 'GPDataFile':
						this.GPDataFileInter(this.inputParams[i]);
					break;
					case 'GPRecordSet':
						this.GPRecordSetInter(this.inputParams[i]);
					break;
					case 'GPFeatureRecordSetLayer':
						this.GPFeatureRecordSetLayerInter(this.inputParams[i], map);
					break;
					case 'GPMultiValue:GPString':
						this.GPMultiVInter(this.inputParams[i]);
					break;
				}
			}
			// includes the Environment Options
			htmlCode = domCost.toDom('<br><fieldset id="outOptions"></fieldset>');
			domCost.place(htmlCode,divInputPar,"last");
			// inserts the input text for the output and process Spatial References
			htmlCode = domCost.toDom('<b>'+this.labels.env_options+'</b><br><br>'+
			'<b>Output Spatial Reference: </b>'+
			'<input style="float:right; margin-right:15%;" type="text "id="outputSR" value="102100"><br><br>');
			domCost.place(htmlCode,'outOptions',"last");
			htmlCode = domCost.toDom('<b>Process Spatial Reference: </b>'+
			'<input style="float:right; margin-right:15%;" type="text "id="processSR">');
			domCost.place(htmlCode,'outOptions',"last");

			// includes the submit button
			htmlCode = domCost.toDom('<br><div align="center"><input type="button" id="submit"></div>');
			domCost.place(htmlCode,divInputPar,"last");
			if(this.taskExeType == 'esriExecutionTypeAsynchronous')
				domAttr.set('submit','value','submit Job');
			else
				domAttr.set('submit','value','execute Task');
			// retrieves the method that creates and manages the buttons listeners
			this.ButtonsListener(map,this.labels);
			logger.debug('End create interface');
			return this.inputParams.length;
		},
		
		GPMultiVInter: function(param){
			// summary:
			//		Generates an input interface for GPMultiValue:GPString parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		If there is a choice list, shows the choices using some input checkbox,
			//		else if there are some default values, shows them into the text boxes
			// tags:
			//		private
			var htmlCode;
			var i=0;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			// if there is a choice list
			if(param.choiceList != null){
				for(var j = 0; j < param.choiceList.length; j++){
					htmlCode = domCost.toDom('<span class="spanChoice"><input type="checkbox" id="param'+
			         param.progressiveNum+'check'+j+'" value="'+param.choiceList[j]+'"> '+
                  param.choiceList[j]+'</span>');
					domCost.place(htmlCode,fieldNode,"last");
				}
				// sets the fieldnode name, indicating the number of choices (index j)
				domAttr.set(fieldNode,"name","numChecks:"+j);
			}
			// if there are default values, inserts them
			else{
				if(param.defValue != null){
					// for each value creates a div with input text and default value.
					// div id structure: param+(progressiveNum)+f+(defValue number)
					for(i ; i < param.defValue.length; i++){
						htmlCode = domCost.toDom('<div id="param'+param.progressiveNum+'f'+i+'">'+
						   '<br>String['+i+']:'+' <input type="text" id="param'+param.progressiveNum+'val'+i+
						   '" value="'+param.defValue[i]+'"></div>');
						domCost.place(htmlCode,fieldNode,"last");
					}
				}
				// else creates a single div for one input text
				else{
					htmlCode = domCost.toDom('<div id="param'+param.progressiveNum+'f'+i+'">String['+i+']:'+
						' <input type="text" id="param'+param.progressiveNum+'val'+i+'"><br></div>');
					domCost.place(htmlCode,fieldNode,"last");
					i++;
				}
				// creates the buttons for adding or removing an input text field
				htmlCode = domCost.toDom('<br><input type="button" class="multiVButtons" id="addButton'+
               param.progressiveNum+'" value="add"><input type="button" class="multiVButtons" id="remButton'+
               param.progressiveNum+'" value="remove">');
				domCost.place(htmlCode,fieldNode,"last");
				// sets the fieldnode name, indicating the currently number of inputs text (index i)
				domAttr.set(fieldNode,"name","numFields:"+i);
			}
			return ;
		},
		GPFeatureRecordSetLayerInter: function(param, map){
			// summary:
			//		Generates an input interface for GPFeatureRecordSetLayer parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			// description:
			//		Displays the textarea for allowing to the user to enter the geometry coordinates.
			//		geometryType coding: GeoPoint, GeoMulPo, GeoPolyg, GeoPolyl
			// tags:
			//		private
			var fieldNode = dom.byId('field'+param.progressiveNum);
			
			// Generates a new Graphics Layer on Map for display the input feature
			var graphicsLayer = new GraphicsLayer({
				id: "param"+param.progressiveNum
			});
			map.addLayer(graphicsLayer);
			
			var htmlCode = domCost.toDom(param.defValue.geometryType+':');
			domCost.place(htmlCode,fieldNode,"last");
			if(param.defValue.geometryType == 'esriGeometryPoint'){
				htmlCode = domCost.toDom('<input type="button" class="drawButtons" id="point'+
					param.progressiveNum+'" value="'+this.labels.draw_button+' '+
					param.defValue.geometryType.substr(12)+
					'"><input type="button" class="redrawButtons" id="rePoint'+param.progressiveNum+
					'" value="'+this.labels.redraw_button+'">');
				domAttr.set(fieldNode,"name","GeoPoint");
			}
			if(param.defValue.geometryType == 'esriGeometryMultipoint'){
				htmlCode = domCost.toDom('<input type="button" class="drawButtons" id="mulPo'+
					param.progressiveNum+'" value="'+this.labels.draw_button+' '+
					param.defValue.geometryType.substr(12)+
					'"><input type="button" class="redrawButtons" id="reMulPo'+param.progressiveNum+
					'" value="'+this.labels.redraw_button+'">');
				domAttr.set(fieldNode,"name","GeoMulPo");
			}
			else if(param.defValue.geometryType == 'esriGeometryPolyline'){
				htmlCode = domCost.toDom('<input type="button" class="drawButtons" id="polyl'+
					param.progressiveNum+'" value="'+this.labels.draw_button+' '+
					param.defValue.geometryType.substr(12)+
					'"><input type="button" class="redrawButtons" id="rePolyl'+param.progressiveNum+
					'" value="'+this.labels.redraw_button+'">');
				domAttr.set(fieldNode,"name","GeoPolyl");
			}
			else if(param.defValue.geometryType == 'esriGeometryPolygon'){
				htmlCode = domCost.toDom('<input type="button" class="drawButtons" id="polyg'+
					param.progressiveNum+'" value="'+this.labels.draw_button+' '+
					param.defValue.geometryType.substr(12)+
					'"><input type="button" class="redrawButtons" id="rePolyg'+param.progressiveNum+
					'" value="'+this.labels.redraw_button+'">');
				domAttr.set(fieldNode,"name","GeoPolyg");
			}
			domCost.place(htmlCode,fieldNode,"last");
			htmlCode = domCost.toDom('<br><textarea id="param'+param.progressiveNum+
				'val0" rows="6" cols="60">');
			domCost.place(htmlCode,fieldNode,"last");
			htmlCode = domCost.toDom('<br> <i>(hasZ: '+param.defValue.hasZ+', hasM: '+
				param.defValue.hasM+')</i>');
			domCost.place(htmlCode,fieldNode,"last");
			return ;
		},
		
		GPLinUnitInter: function(param){
			// summary:
			//		Generates an input interface for GPLinearUnit parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays the distance's input number and a select input with all possible units. 
			//		If there is a default value, preselect it.
			// tags:
			//		private
			// no unknown for UNITS
			var UNITS = ["Acres","Ares","Centimeters","DecimalDegrees","Decimeters","DegreeMinuteSeconds",
				"Feet","Hectares","Inches","Kilometers","Meters","Miles","Millimeters","NauticalMiles","Points",
				"SquareCentimeters","SquareDecimeters","SquareFeet","SquareInches","SquareKilometers",
				"SquareMeters","SquareMiles","SquareMillimeters","SquareYards","Yards"];
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			if(param.defValue != null){
				htmlCode = domCost.toDom('<input type="number" min="1" id="param'+param.progressiveNum+
					'val0" value="'+param.defValue.distance+'">');
				domCost.place(htmlCode,fieldNode,"last");
				htmlCode = domCost.toDom('<select id="param'+param.progressiveNum+'val1"></select>');
				domCost.place(htmlCode,fieldNode,"last");
				for(var i = 0; i < UNITS.length; i++){
					if(param.defValue.unit.substr(4) == UNITS[i])
						htmlCode = domCost.toDom('<option value="'+UNITS[i]+'" selected="selected">'+
							this.labels.units[i]+'</option>');
					else
						htmlCode = domCost.toDom('<option value="'+UNITS[i]+'">'+this.labels.units[i]+'</option>');
					domCost.place(htmlCode,'param'+param.progressiveNum+'val1',"last");
				}
			}
			else{
				htmlCode = domCost.toDom('<input type="number" min="1" id="param'+param.progressiveNum+'val0">');
				domCost.place(htmlCode,fieldNode,"last");
				htmlCode = domCost.toDom('<select id="param'+param.progressiveNum+'val1"></select>');
				domCost.place(htmlCode,fieldNode,"last");
				for(var i = 0; i < UNITS.length; i++){
					htmlCode = domCost.toDom('<option value="'+UNITS[i]+'">'+UNITS[i]+'</option>');
					domCost.place(htmlCode,'param'+param.progressiveNum+'val1',"last");
				}
			}
			return ;
		},
		GPRecordSetInter: function(param){
			// summary:
			//		Generates an input interface for GPRecordSet parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays the RecordSet's input textarea. If there is a default value, inserts it.
			// tags:
			//		private
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			htmlCode = domCost.toDom('<textarea id="param'+param.progressiveNum+'val0" rows="10" cols="60">');
			domCost.place(htmlCode,fieldNode,"last");
			if(typeof (param.defValue) == 'object')
				domAttr.set('param'+param.progressiveNum+'val0',"value",JSON.stringify(param.defValue));
			return ;
		},
		
		GPDataFileInter: function(param){
			// summary:
			//		Generates an input interface for GPDataFile parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays the DataFile's input text.
			// tags:
			//		private
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			htmlCode = domCost.toDom('URL: <input type="text" class="urlResourse" id="param'+
				param.progressiveNum+'val0">');
			domCost.place(htmlCode,fieldNode,"last");
			return ;
		},

		GPDateInter: function(param){
			// summary:
			//		Generates an input interface for GPDate parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays an html5 "datetime-local" input box. If there is a default value, inserts it.
			//		Explorer and Firefox Mozilla DON'T SUPPORT this inpus field
			// tags:
			//		private
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			if(param.defValue != null)
				htmlCode = domCost.toDom('<input type="datetime-local" id="param'+param.progressiveNum+
					'val0" value="'+param.defValue+'" step=.001>');
			else
				htmlCode = domCost.toDom('<input type="datetime-local" id="param'+param.progressiveNum+
					'val0" step=.001>');
			domCost.place(htmlCode,fieldNode,"last");
			return ;
		},
		
		GPDoubLongInter: function(param){
			// summary:
			//		Generates an input interface for GPDouble and GPLong parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		If a choice list is empty, displays a number input box, else retrieves the
			//		ChoiceBox method that manages the input boxes
			// tags:
			//		private
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			
			if(param.choiceList == null){
				htmlCode = domCost.toDom('<input type="number" id="param'+param.progressiveNum+'val0">');
				domCost.place(htmlCode,fieldNode,"last");
				if(typeof param.defValue == 'number')
					domAttr.set('param'+param.progressiveNum+'val0',"value",param.defValue);
			}
			else{
				this.ChoiceBox(param);
			}
			return ;
		},

		GPBooleanInter: function(param){
			// summary:
			//		Generates an input interface for GPBoolean parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays two exclusive radio button input. If there is a default value, preselect it
			// tags:
			//		private
			var htmlCode;
			htmlCode = domCost.toDom('<div id="param'+param.progressiveNum+'val0" name="radio"></div>');
			domCost.place(htmlCode,'field'+param.progressiveNum,"last");
			
			var divNode = dom.byId('param'+param.progressiveNum+'val0');
			htmlCode = domCost.toDom('<input type="radio" id="param'+param.progressiveNum+
				'val0check0" name="param'+param.progressiveNum+'val0" value="true"> true'+
				'<input type="radio" id="param'+param.progressiveNum+
				'val0check1" name="param'+param.progressiveNum+'val0" value="false"> false');
			domCost.place(htmlCode,divNode,"last");
			
			if(param.defValue == true)
				domAttr.set('param'+param.progressiveNum+'val0check0',"checked","checked");
			else if(param.defValue == false)
				domAttr.set('param'+param.progressiveNum+'val0check1',"checked","checked");
				
			return ;
			
		},

		GPStringInter: function(param){
			// summary:
			//		Generates an input interface for GPString parameters
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		Displays a textbox input and the possible default value.
			//		If the choice list isn't empty, retrieves the ChoiceBox method that manages the input boxes
			// tags:
			//		private
			var htmlCode;
			var fieldNode = dom.byId('field'+param.progressiveNum);
			if(param.choiceList == null){
				htmlCode = domCost.toDom('<textarea rows="2" cols="50" id="param'+param.progressiveNum+
					'val0"></textarea>');
				domCost.place(htmlCode,fieldNode,"last");
				if(param.defValue != null){
					if(typeof (param.defValue) == 'object')
						domAttr.set('param'+param.progressiveNum+'val0',"value",JSON.stringify(param.defValue));
					else
						domAttr.set('param'+param.progressiveNum+'val0',"value",param.defValue);
				}
			}
			else
				this.ChoiceBox(param);
			return ;
		},
		
		InitParamField: function(divInputPar,dataType,paramName,description,progressiveNum,paramType){
			// summary:
			//		Generates an input structure for each input parameter and relative description div
			// divInputParam: [readonly] String
			//		div that contains the user input interface
			// dataType: [readonly] String
			//		The data type of parameter (GPString, GPBoolean, GPDouble...)
			// paramName: [readonly] String
			//		The parameter display name
			// description: [readonly] String
			//		The parameter description
			// progressiveNum: [readonly] Integer
			//		The progressive number assigned to the parameter
			// paramType: [readonly] String
			//		The type of parameter: "esriParameterTypeRequired", "esriParameterTypeOptional"
			//		or "esriParameterTypeDerived"(only for output parameter)
			// description:
			//		For each parameter creates a html5 fieldset that contains the input interface,
			//		if the parameter type is "Optional", the user can disable the fieldset 
			//		by the "disable" checkbox.
			//		The fieldset shows the parameter name and the description.
			// tags:
			//		private
			var htmlCode;
			if(paramType == 'esriGPParameterTypeOptional')
				htmlCode = domCost.toDom('<fieldset id="field'+progressiveNum+'"><legend>'+dataType+
					' ('+this.labels.optional_text+
					') <input type="checkbox" class="disableFieldCheck" id="disableField'+
					progressiveNum+'"> '+this.labels.disable_check+'</legend></fieldset>');
			else
				htmlCode = domCost.toDom('<fieldset id="field'+progressiveNum+'"><legend>'+dataType+
					'</legend></fieldset>');
			domCost.place(htmlCode,divInputPar,"last");
			var fNode = dom.byId('field'+progressiveNum);
			
			htmlCode = domCost.toDom(''+paramName+': <br>');
			domCost.place(htmlCode,fNode,"last");
			
			if(description != null){
				htmlCode = domCost.toDom('Description: <input type="button" class="descButtons" id="param'+
					progressiveNum+'" value="'+this.labels.show_button+'">');
				domCost.place(htmlCode,fNode,"last");
				htmlCode = domCost.toDom('<br><div id="desc'+progressiveNum+'" style="display:none">'+
					description+'<br></div><br>');
				domCost.place(htmlCode,fNode,"last");
			}
			return ;
		},

		ChoiceBox: function(param){
			// summary:
			//		Generates an input box for a choice list
			// param: [readonly] Object Param
			//		The information about the parameter
			// description:
			//		If the length of the choice list is smaller then 7, creates a radio button input structure,
			//		else, creates a select input structure 
			// tags:
			//		private
			var choiceCode;
			if(param.choiceList.length < 7){
				var choiceCode = domCost.toDom('<div id="param'+param.progressiveNum+
					'val0" name="radio"></div>');
				domCost.place(choiceCode,'field'+param.progressiveNum,"last");
				var radioCode;
				for(var j = 0 ; j < param.choiceList.length ; j++){
					// if the j-th choice list value is equal to default value, preselect it
					if(param.defValue == param.choiceList[j])
						radioCode = domCost.toDom('<span class="spanChoice"><input type="radio" id="param'+
							param.progressiveNum+'val0check'+j+'" name="param'+param.progressiveNum+
							'val0" value="'+param.choiceList[j]+'" checked="checked"> '+
							param.choiceList[j]+'</span>');
					else
						radioCode = domCost.toDom('<span class="spanChoice"><input type="radio" id="param'+
							param.progressiveNum+'val0check'+j+'" name="param'+param.progressiveNum+
							'val0" value="'+param.choiceList[j]+'"> '+param.choiceList[j]+'</span>');
					domCost.place(radioCode,'param'+param.progressiveNum+'val0',"last");
				}
			}
			else{
				var selectCode = domCost.toDom('<select class="selectChoice" id="param'+
					param.progressiveNum+'val0">');
				domCost.place(selectCode,'field'+param.progressiveNum,"last");
				for(var i = 0; i < param.choiceList.length; i++){
					// if the i-th choice list value is equal to default value, preselect it
					if(param.defValue == param.choiceList[i])
						selectCode = domCost.toDom('<option value="'+param.choiceList[i]+
							'" selected="selected">'+param.choiceList[i]+'</option>');
					else
						selectCode = domCost.toDom('<option value="'+param.choiceList[i]+'">'+
							param.choiceList[i]+'</option>');
						domCost.place(selectCode,'param'+param.progressiveNum+'val0',"last");
				}
			}
			return ;
		},
		ButtonsListener: function(map,labels){
			// summary:
			//		Generates the code that defines and manages the buttons event listeners
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			// labels: Object
			//		Contains the labels in the current language
			// description:
			//		Instantiate the clickHandlers object that includes the methods called by the buttons
			//		event listener and creates the events listener for:
			//		- enabling/disabling a fieldset
			//		- show/hide the parameter's description
			//		- add/remove a field of MultiValue parameter
			//		- draw on map a geometry
			//		- redraw the feature contained on relative input textarea
			// tags:
			//		private
			var clickHandlers = {
				// summary:
				//		Defines the methods called by the buttons event listener
				// id: String
				//		The id of clicked button
				// tags:
				//		private
				id: null,
				// method that handles the fieldset's enabling/disabling
				onClickDisableField: function(evt){
					var numField = this.id.substr(12);
					var field = 'field'+numField;
					if(dom.byId(this.id).checked)
		    			domAttr.set(field,'disabled',true);
					else
		    			domAttr.set(field,'disabled',false);
				},
				// method that handles the buttons that shows/hides the parameter description
				onClickDescriptionButton: function(evt){
					// strutcture Description buttons id: param+(progressiveNum)
					// recovers the id of clicked button and generates the respective div id
					var descriptionDiv = 'desc'+this.id.substr(5);
					// recovers the div's display attribute 
					var disp = domStyle.get(descriptionDiv,"display");
					// if hidden, changes to show
					if(disp == 'none'){
						domStyle.set(descriptionDiv,"display","inline");
						domAttr.set(this.id,"value",labels.hide_button);
					}
					else if(disp == 'inline'){
						domStyle.set(descriptionDiv,"display","none");
						domAttr.set(this.id,"value",labels.show_button);
					}
				},
				// method that handles the buttons that adds/removes a multiValue field
				onClickMultiValue: function(evt){
					// structure of add/remove multivalue field button: (add/rem)Button+(progressiveNum)
					// recovers the id of clicked button 
					var parameter = this.id.substr(9);
					// structure of fieldset name: numFields+(current number of fields)
					// fieldset name indicates the current number of fields
					var lastField = domAttr.get('field'+parameter,"name");
					lastField = lastField.substr(10);
					// if the name's prefix of the clicked button is 'add'
					if(this.id.substr(0, 3) == "add"){
						var htmlCode = domCost.toDom('<div id="param'+parameter+'f'+lastField+
						'"><br>String['+lastField+']: <input type="text" id="param'+parameter+
						'val'+lastField+'"></div>');
						domCost.place(htmlCode,'param'+parameter+'f'+(lastField-1),"after");
						lastField++;
						domAttr.set('field'+parameter,"name",'numFields:'+lastField);
					}
					// else if the name's prefix is 'rem' and the current number of fields is greater than zero
					else if(this.id.substr(0, 3) == "rem" && lastField > 1){
						lastField--;
						domCost.destroy('param'+parameter+'f'+lastField);
						domAttr.set('field'+parameter,"name",'numFields:'+lastField);
					}
				},
			   // method that handles the buttons for drawing on map the geometry
				onClickDrawButton: function(evt){
					logger.debug('Draw Feature');
			   	map.graphics.clear();
			   	var layers = map.layerIds;
			   	// removes all the map image on the map
					for(var i=0; i < layers.length; i++){
	               if(layers[i].substr(0,6) == 'result')
	                  map.removeLayer(map.getLayer(layers[i]));
					}
			    	var parameter = this.id.substr(5);
			    	var geometry = this.id.substr(0,5);
			    	var drawTool = new Draw(map);
			    	var symbol = null;
			    	if(geometry == 'point'){
			    		symbol = new SimpleMarkerSymbol();
						symbol.setSize(25);
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 1));
						symbol.setColor(new Color([0,255,128,0.35]));
						drawTool.activate(Draw.POINT);
					}
					else if(geometry == 'mulPo'){
						symbol = new SimpleMarkerSymbol();
						symbol.setSize(25);
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 1));
						symbol.setColor(new Color([0,255,128,0.35]));
						drawTool.activate(Draw.MULTI_POINT);
					}
					else if(geometry == 'polyg'){
						symbol = new SimpleFillSymbol();
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 2));
						symbol.setColor(new Color([0,255,128,0.25]));
						drawTool.activate(Draw.POLYGON);
					}
					else if(geometry == 'polyl'){
						symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,255,128,0.45]), 4);
						drawTool.activate(Draw.POLYLINE);
					}
					
					var signal = on(dom.byId('taskDiv'),'click', function(evt){
						if(evt.target.id != geometry+parameter){
							signal.remove();
							drawTool.deactivate();
						}
					});
					drawTool.on("draw-end", function(evt){
						drawTool.deactivate();
						var layer = map.getLayer('param'+parameter);
						var graphic = new Graphic(evt.geometry);
						var features = [];
						if(domAttr.get('param'+parameter+'val0','value')){
							try{
								var prevFeat = JSON.parse(domAttr.get('param'+parameter+'val0','value'));
								for(var i=0; i < prevFeat.features.length; i++){
									var prevGraphic = new Graphic(prevFeat.features[i]);
									delete prevGraphic.symbol;
									delete prevGraphic.attributes;
									delete prevGraphic.infoTemplate;
									features.push(prevGraphic);
								}
							}catch(e){
								var dialog = new Dialog({
								   title: "Error",
								   content: "Feature Syntax Error - <br>"+labels.feat_delete,
					            style: "width: 300px;"
								});
								dialog.show();
								logger.warn('Previous Feature Syntax Error');
								layer.clear();
							}
						}
						features.push(graphic);
						var featureSet = new FeatureSet();
						featureSet.features = features;
						var param = JSON.stringify(featureSet);
						domAttr.set('param'+parameter+'val0','value',param);

						graphic.setSymbol(symbol);
						layer.add(graphic);
					});
				},
				// method that handles the buttons for redrawing on map the geometry
				onClickRedrawButton: function(evt){
					logger.debug('Redraw Feature');
		   		map.graphics.clear();
		   		var layers = map.layerIds;
		   		// removes all the map image on the map
					for(var i=0; i < layers.length; i++){
	               if(layers[i].substr(0,6) == 'result')
	                  map.removeLayer(map.getLayer(layers[i]));
					}
		   		var parameter = this.id.substr(7);
			    	var geometry = this.id.substr(2,5);
			    	var symbol = null;
			    	var layer = map.getLayer('param'+parameter);
			    	layer.clear();
					if(geometry == 'Point'){
			    		symbol = new SimpleMarkerSymbol();
						symbol.setSize(25);
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 1));
						symbol.setColor(new Color([0,255,128,0.35]));
					}
					else if(geometry == 'MulPo'){
						symbol = new SimpleMarkerSymbol();
						symbol.setSize(25);
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 1));
						symbol.setColor(new Color([0,255,128,0.35]));
					}
					else if(geometry == 'Polyg'){
						symbol = new SimpleFillSymbol();
						symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,0,0,0.5]), 2));
						symbol.setColor(new Color([0,255,128,0.25]));
					}
					else if(geometry == 'Polyl'){
						symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
							new Color([0,255,128,0.45]), 4);
					}
					try{
						var parameter = JSON.parse(dom.byId('param'+parameter+'val0').value);
						var graphics = [];
						for(var i=0; i < parameter.features.length; i++){
							var graphic = new Graphic(parameter.features[i]);
							graphic.setSymbol(symbol);
							layer.add(graphic);
							graphics.push(graphic);
						}
						map.setExtent(graphicsUtils.graphicsExtent(graphics), true);
					}catch(e){
						var dialog = new Dialog({
						   title: "Redraw Error",
						   content: "Feature Syntax Error",
			            style: "width: 300px;"
						});
						dialog.show();
						layer.clear();
						logger.warn('Feature Syntax Error');
					}
			   }
			};
			// for each button's class instantiates the listener
			query(".disableFieldCheck").on("click", clickHandlers.onClickDisableField);
			query(".descButtons").on("click", clickHandlers.onClickDescriptionButton);
			query(".multiVButtons").on("click", clickHandlers.onClickMultiValue);
			query(".drawButtons").on("click", clickHandlers.onClickDrawButton);
			query(".redrawButtons").on("click", clickHandlers.onClickRedrawButton);
		},
		
	});
	
});