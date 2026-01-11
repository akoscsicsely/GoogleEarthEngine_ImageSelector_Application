var app = {};

app.createpanels = function (){
  app.createhelpers();
  app.constants();
  app.bev = {
    panel: ui.Panel({
      widgets: [
        ui.Label({value:'Sentinel 2 application',
                 style: {fontWeight:'bold', fontSize:'20px', color:'orange'}})]
    })
  };
  
  app.time = { 
      cloud: ui.Checkbox({label: 'Cloud cover filtering', value: true}),
      startDate: ui.Textbox('YYYY-MM-DD', '2020-01-01'),
      endDate: ui.Textbox('YYYY-MM-DD', '2020-03-01'),
      applyButton: ui.Button('Apply filters', app.applyFilters),
    };
  
  app.time.panel = ui.Panel({
    widgets: [
      ui.Label('1) Choose the date', {fontWeight: 'bold'}),
      ui.Label('Start date', app.SECTION_STYLE), app.time.startDate,
      ui.Label('End date', app.SECTION_STYLE), app.time.endDate,
      app.time.cloud,
      ui.Panel([
        app.time.applyButton,
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });
  
  app.picker = {
    select: ui.Select({
      placeholder: 'Select the image',
      onChange: app.refreshMapLayer
    }),
    centerButton: ui.Button('Set map center on the image', function() {
      Map.centerObject(Map.layers().get(0).get('eeObject'));
    })
};

  app.picker.panel = ui.Panel({
    widgets: [
      ui.Label('2) Select the image', {fontWeight: 'bold'}),
      ui.Panel({
        widgets: [
        app.picker.select,
        app.picker.centerButton
      ],
      })],
    style: app.SECTION_STYLE
      });
      
    app.vis = {
    label: ui.Label(),
    select: ui.Select({
      items: Object.keys(app.VIS_OPTIONS),
      onChange: function() {
        var option = app.VIS_OPTIONS[app.vis.select.getValue()];
        app.vis.label.setValue(option.description);
        app.refreshMapLayer();
      }
    })
    };
    
  app.vis.panel = ui.Panel({
    widgets: [
      ui.Label('3) Select the visualisation', {fontWeight: 'bold'}),
      app.vis.select,
      app.vis.label
    ],
    style: app.SECTION_STYLE
  });
  
  app.vis.select.setValue(app.vis.select.items().get(0));
  
  app.export = {
    button: ui.Button({
      label: 'Save to Google Drive',
      onClick: function() {
        var imageIdTrailer = app.picker.select.getValue();
        var imageId = app.SAT_ID + '/' + imageIdTrailer;
        var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
        Export.image.toDrive({
          image: ee.Image(imageId).select(visOption.visParams.bands),
          description: 'S2_Export-' + imageIdTrailer,
        });
      }
    })
  };
  
  app.export.panel = ui.Panel({
    widgets: [
      ui.Label('4) Export image', {fontWeight: 'bold'}),
      app.export.button
    ],
    style: app.SECTION_STYLE
  });
};
app.createhelpers = function () {
  
  app.constants();
  
  app.applyFilters = function () {
    
    var x = Map.getCenter();
    var filtered = ee.ImageCollection(app.SAT_ID).filterBounds(x);

    if (app.time.cloud.getValue()) {
    filtered = filtered.filterBounds(x).filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 30);
    }        
    
    var start = app.time.startDate.getValue();
    if (start) start = ee.Date(start);
    var end = app.time.endDate.getValue();
    if (end) end = ee.Date(end);
    if (start) filtered = filtered.filterDate(start, end);
    
    var computedIds = filtered
        .limit(app.MAX_IMAGE_COUNT)
        .reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');
        
    computedIds.evaluate(function(ids) {

      app.picker.select.items().reset(ids);
      app.picker.select.setValue(app.picker.select.items().get(0));
    });
};

  app.refreshMapLayer = function() {
    app.constants();
    Map.clear();
    var imageId = app.picker.select.getValue();
    if (imageId) {
      var image = ee.Image(app.SAT_ID + '/' + imageId);
      var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
      Map.addLayer(image, visOption.visParams, imageId);
    }
};
};
app.constants = function () {
  app.SAT_ID = "COPERNICUS/S2_SR";
  app.SECTION_STYLE = {fontSize: '16px', color:'orange'};
  app.MAX_IMAGE_COUNT = 15;
  app.VIS_OPTIONS = {
    'True colors (B4/B3/B2)': {
      description: 'Select natural colors as visualisation.',
      visParams: {gamma: 1.3, min: 388.34000000000003, max: 8996.66, opacity: 1, bands: ['B4', 'B3', 'B2']}
    },
    'NDVI' : {
      description: 'Select Normalised Vegatation Index as visualisation.',
      visParams: function addNDVI(input) {
  var ndvi = input.normalizedDifference(["B8", "B4"]);
  return  input.addBands(ndvi)}
    },
    'Geological (B12/B11/B2)': {
      description: 'Visualization for geological investigations.',
      visParams: {gamma: 10, min: 2399.5, max: 15667.5, opacity:1, bands: ['B12', 'B11', 'B2']}
    },
    'Infrared (B8/B4/B3)' : {
      description: 'A combination of bands that can be used to examine vegetation.',
      visParams: {gamma: 2.3960000000000004, min: 456.40000000000003, max: 3691.6, opacity: 1, bands: ['B8', 'B4', 'B3']}
    }
  };
};

app.createmenu = function () {
  app.createpanels();
  app.constants();
  app.createhelpers();
  var main = ui.Panel ({
    widgets:[
      app.bev.panel,
      app.time.panel,
      app.picker.panel,
      app.vis.panel,
      app.export.panel],
    style: {width: '320px'}
  });
  Map.setCenter(19.420229648570206, 47.02967256950789, 7);
  ui.root.insert(0, main);
};

app.createmenu();
