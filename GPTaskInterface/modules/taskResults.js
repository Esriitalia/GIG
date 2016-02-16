// author: Roberto Palmieri			version: 11-11-2015
define(["esri/map","esri/Color","esri/graphic","esri/graphicsUtils","esri/geometry/Extent",
	"esri/tasks/Geoprocessor","esri/layers/ImageParameters","esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleLineSymbol","esri/symbols/SimpleFillSymbol","esri/InfoTemplate",
	"dojo/_base/declare","dojo/dom","dojo/on","dojo/dom-construct","dojo/dom-style",
	"log/logger!","dojo/domReady!"],
function(Map, Color, Graphic, graphicsUtils, Extent, Geoprocessor, ImageParameters, SimpleMarkerSymbol,
	SimpleLineSymbol, SimpleFillSymbol, InfoTemplate, declare, dom, on, domCost, domStyle, logger){
	return declare(null,{
		// results: ParameterValue[]
		//		The array contains the results of GPTask
		// messages: String[]
		//		The array contains the messages returned from the server
		// taskUrl: String
		//		GPTask's URL
		// jobId: int
		//		The unique job ID assigned to the current job by ArcGIS Server
		// labels: [readonly] Object
		//		Contains the labels in the current language
		results: null,
		messages: null,
		taskUrl: null,
		jobId: null,
		labels: null,
		constructor: function(options){
			// summary:
			//		Class that shows the GPTask results
			// description:
			//		Draws on the map the feature results and shows at the bottom the other types of results
			this.results = options.results;
			this.messages = options.messages;
			this.taskUrl = options.taskUrl;
			this.jobId = options.jobId;
			this.labels = options.labels || null;
		},
		showResults: function(textResult,map){
			// summary:
			//		Draws on the map the feature results and shows at the bottom the other types of results
			// textResult: String
			//		The div id for the textual results
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			var htmlCode;
			map.graphics.clear();
			
			logger.debug('Start show results');
			htmlCode = domCost.toDom('<b>'+this.labels.text_res+'<b><br><br>');
			domCost.place(htmlCode,textResult,'last');
			
			var txt_res = false;
			// Shows each result object
			for(var i=0; i < this.results.length; i++){
				switch(this.results[i].dataType){
					case 'GPMultiValue:GPString':{
						htmlCode = domCost.toDom('<fieldset id="result'+i+'"><legend>'+this.results[i].dataType+
							'</legend> '+
						this.results[i].paramName+': <br></fieldset>');
						domCost.place(htmlCode,textResult,'last');
						for(var j=0; j < this.results[i].value.length; j++){
							htmlCode = domCost.toDom('&nbsp;-&nbsp;'+this.results[i].value[j]+'<br>');
							domCost.place(htmlCode,'result'+i,'last');
						}
						txt_res = true;
					}
					break;
					case 'GPDataFile':
					case 'GPRasterDataLayer':
					case 'GPRasterData':{
						htmlCode = domCost.toDom('<fieldset><legend>'+this.results[i].dataType+'</legend><b>'+
							this.results[i].paramName+':</b><br><a href="'+this.results[i].value.url+
							'" target="_blank">'+this.results[i].value.url+'</a></fieldset>');
						domCost.place(htmlCode,textResult,'last');
						txt_res = true;
					}
					break;
					case 'GPFeatureRecordSetLayer':{
						this.showFeatureRecordSL(this.results[i],i,map);
					}
					break;
					case 'GPString':
					case 'GPBoolean':
					case 'GPDouble':
					case 'GPLong':{
						if(typeof (this.results[i].value) == 'object'){
							var strfyValue = JSON.stringify(this.results[i].value);
							htmlCode = domCost.toDom('<fieldset><legend>'+this.results[i].dataType+'</legend><b>'+
								this.results[i].paramName+':</b> '+strfyValue+'</fieldset>');
						}
						else{
							htmlCode = domCost.toDom('<fieldset><legend>'+this.results[i].dataType+'</legend><b>'+
								this.results[i].paramName+':</b> '+this.results[i].value+'</fieldset>');
						}
						domCost.place(htmlCode,textResult,'last');
						txt_res = true;
					}
					break;
					// converts the date numeric value to date string
					case 'GPDate':{
						htmlCode = domCost.toDom('<fieldset><legend>'+this.results[i].dataType+'</legend><b>'+
							this.results[i].paramName+':</b> '+this.results[i].value.toString()+'</fieldset>');
						domCost.place(htmlCode,textResult,'last');
						txt_res = true;
					}
					break;
					case 'GPLinearUnit':{
						htmlCode = domCost.toDom('<fieldset><legend>'+this.results[i].dataType+'</legend><b>'+
							this.results[i].paramName+':</b> '+this.results[i].value.distance+' '+
							this.results[i].value.untis+'</fieldset>');
						domCost.place(htmlCode,textResult,'last');
						txt_res = true;
					}
					break;
					case 'GPRecordSet':{
						var features = this.results[i].value.features;
						if(features.length != 0){
							// creates the fieldset and the table to show the recordset 
							htmlCode = domCost.toDom('<fieldset style="overflow-x:auto;"><legend>'+
								this.results[i].dataType+'</legend><b>'+this.results[i].paramName+
								':</b><br><table id="table'+i+'"></table></fieldset>');
							domCost.place(htmlCode,textResult,'last');
							// defines the table's attributes
							var cols = Object.keys(features[0].attributes);
							var record = '<tr>';
							for (j = 0; j < cols.length; j++){
								record += '<th>'+cols[j]+'</th>';
							}
							record += '</tr>';
							for(var j = 0; j < features.length; j++){
								var attributes = features[j].attributes;
								record += '<tr>';
								for(att in attributes){
									if(attributes.hasOwnProperty(att)){
										record += '<td>'+attributes[att]+'</td>';
									}
								}
								record += '</tr>';
							}
							domCost.place(domCost.toDom(record),'table'+i,'last');
						}
						// If the results table is empty, it is notify to the user
						else{
							htmlCode = domCost.toDom('<fieldset style="overflow-x:auto;"><legend>'+
								this.results[i].dataType+'</legend><b>'+this.results[i].paramName+
								':</b><br><i>No Data</i></fieldset>');
							domCost.place(htmlCode,textResult,'last');
						}
						txt_res = true;
					}
					break;
				}
			}
			// if there are textual results, it shows them
			if (txt_res)
				domStyle.set(textResult,"display","inline");
			logger.debug('End show results');
		},
		
		showFeatureRecordSL: function(param,index,map){
			// summary:
			//		Draws a single feature result on the map
			// param: ParameterValue
			//		The output parameter returned by the GPTask
			// index: int
			//		The index of the output parameter
			// map: Map
			//		The esri class that contains the DOM structure for adding layers, graphics 
			//		and other map controls
			// tags:
			//		private
			
			// if the feature is empty, retrieves the map image from the server
			if(param.value.features.length == 0){
				var gp = new Geoprocessor(this.taskUrl);
				var imageParams = new ImageParameters();
				imageParams.format = 'png';
				imageParams.opacity = 0.8;
				gp.getResultImageLayer(this.jobId,param.paramName,imageParams, function(gpLayer){
					if(logger.isInfoEnabled())
						console.log('Map Image: ',gpLayer);
					gpLayer.id = 'result'+index;
					map.addLayer(gpLayer);
				});
				gp.on('error', function(e){
					logger.warn('Failed to get Map Image', e);
				});
			}
			else{
				var symbol = null;
				var template = new InfoTemplate();
				
				if(param.value.geometryType == 'esriGeometryPolygon'){
					symbol = new SimpleFillSymbol();
					symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
						new Color([0,0,0,0.5]), 2));
		            symbol.setColor(new Color([255, 127, 0, 0.7]));
				}
				else if(param.value.geometryType == 'esriGeometryPolyline'){
					symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
						new Color([255, 127, 0, 0.7]), 4);
				}
				else if(param.value.geometryType == 'esriGeometryPoint'){
					symbol = new SimpleMarkerSymbol();
					symbol.setSize(14);
					symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
						new Color([0, 0, 0, 0.5]), 1));
					symbol.setColor(new Color([255, 127, 0, 0.6]));
				}
				var features = param.value.features;
				
				// settings for the infoTemplate
				if(features[0].attributes.length != 0){
					var attr = features[0].attributes;
					var contentText = '';
					for(var field in attr){
						if(attr.hasOwnProperty(field))
							contentText += field+': ${'+field+'}<br>';
					}
					template.setContent(contentText);
				}
				// adds the features on the map
				for (var f = 0; f < features.length; f++){
					var feature = features[f];
					feature.setSymbol(symbol);
					feature.setInfoTemplate(template);
					map.graphics.add(feature);
				}
				if(features.length == 1)
					map.setExtent(features[0]._extent, true);
				else if(features.length > 1)
					map.setExtent(graphicsUtils.graphicsExtent(features), true);
				}
		},
	});
});
