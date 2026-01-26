# GoogleEarthEngine_ImageSelector_Application
Repository for satellite image filtering and image processing for MODIS, Sentinel 2 and Landsat 8
-------------------

This repository contains Google Earth Engine script files for satellite image processing.
Target satellites: MODIS, Sentinel 2, Landsat 8

Flow: images can be filtered by location and timeframe. After the filters get adjusted, the image IDs get listed which fullfills all the conditions.
Image visualisation: 3-band visualisation, except MODIS.

Sentinel 2:
- True colors (B4/B3/B2)
- NDVI
- Geological (B12/B11/B2)
- Infrared (B8/B4/B3)

MODIS:
- NDVI

LANDSAT 8:
- True colors (B4/B3/B2)
- NDVI
- Water and mainland (B5/B6/B4)
- Vegetation analysis (B6/B5/B4)

Option to save selected image on Google Drive.

Current status: Sentinel 2, Landsat 8 and MODIS scripts are present.
Future update: all satellites in one script

********************************* Csicsely Ákos 2020 **************************************
