var app = {};
var alap = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");

app.createpanels = function (){
  app.createhelpers();
  app.constants();
  
  app.bev = {
    panel: ui.Panel({
      widgets: [
        ui.Label({value:'Landsat 8 alkalmazás',
                 style: {fontWeight:'bold', fontSize:'20px', color:'blue'}})]
    })
  };

  app.time = { 
      cloud: ui.Checkbox({label: 'Felhőborítottság szűrése', value: true}),
      startDate: ui.Textbox('YYYY-MM-DD', '2020-01-01'),
      endDate: ui.Textbox('YYYY-MM-DD', '2020-03-01'),
      applyButton: ui.Button('Szűrő jóváhagyása', app.applyFilters),
    };
  
  app.time.panel = ui.Panel({
    widgets: [
      ui.Label('1) Időpont kiválasztása', {fontWeight: 'bold'}),
      ui.Label('Kezdő dátum', app.SECTION_STYLE), app.time.startDate,
      ui.Label('Végső dátum', app.SECTION_STYLE), app.time.endDate,
      app.time.cloud,
      ui.Panel([
        app.time.applyButton,
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });
  
  app.picker = {
    select: ui.Select({
      placeholder: 'Felvétel kiválasztása',
      onChange: app.refreshMapLayer
    }),
    centerButton: ui.Button('Térkép középpontja a felvétel', function() {
      Map.centerObject(Map.layers().get(0).get('eeObject'));
    })
};

  app.picker.panel = ui.Panel({
    widgets: [
      ui.Label('2) Felvétel kiválasztása', {fontWeight: 'bold'}),
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
      ui.Label('3) Vizualizáció kiválasztása', {fontWeight: 'bold'}),
      app.vis.select,
      app.vis.label
    ],
    style: app.SECTION_STYLE
  });
  
  app.vis.select.setValue(app.vis.select.items().get(0));
  
  app.export = {
    button: ui.Button({
      label: 'Mentés Drive-ra',
      onClick: function() {
        var imageIdTrailer = app.picker.select.getValue();
        var imageId = app.SAT_ID + '/' + imageIdTrailer;
        var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
        Export.image.toDrive({
          image: ee.Image(imageId).select(visOption.visParams.bands),
          description: 'L8_Export-' + imageIdTrailer,
        });
      }
    })
  };
  
  app.export.panel = ui.Panel({
    widgets: [
      ui.Label('4) Felvétel exportálása', {fontWeight: 'bold'}),
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
    filtered = filtered.filterMetadata('CLOUD_COVER', 'less_than', 30);
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
  app.SAT_ID = "LANDSAT/LC08/C02/T1_TOA";
  app.SECTION_STYLE = {fontSize: '16px', color:'blue'};
  app.MAX_IMAGE_COUNT = 15;
  app.VIS_OPTIONS = {
    'Természetes színek (B4/B3/B2)': {
      description: 'Természetes színek hozzáadása a felvételhez mint vizualizáció.',
      visParams: {gamma: 1.3, min: 0.07952732920646667, max: 0.392918576002121, opacity: 1, bands: ['B4', 'B3', 'B2']}
    },
    'NDVI' : {
      description: 'Normalizált vegetációs index aktiválása a rétegen mint vizualizáció.',
      visParams: function addNDVI(input) {
  var ndvi = input.normalizedDifference(["B5", "B4"]);
  return  input.addBands(ndvi)}
    },
    'Víz és szárazföld (B5/B6/B4)': {
      description: 'Vízfelület és szárazföld reprezentálására szolgál.',
      visParams: {gamma: 10, min: 0.14774647804725785, max: 0.220919173756314, opacity:1, bands: ['B5', 'B6', 'B4']}
    },
    'Vegetáció analízis (B6/B5/B4)' : {
      description: 'A növényzet vizsgálatához használható sávkombináció.',
      visParams: {gamma: 2.3960000000000004, min: 0.11340698003768922, max: 0.6808958411216736, opacity: 1, bands: ['B6', 'B5', 'B4']}
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
  Map.addLayer(alap);
  ui.root.insert(0, main);
};

app.createmenu();
