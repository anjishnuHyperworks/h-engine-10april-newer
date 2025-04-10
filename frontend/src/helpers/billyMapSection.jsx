import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import ImageLayer from 'ol/layer/Image.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import {Fill, Stroke, Style} from 'ol/style.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import { usePolygons } from '../contexts/polygonContext';

export function MapSection({ layerStates = { raster1: true, raster2: true } }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const layersRef = useRef({
    raster1: null,
    raster2: null
  });
  const { activePolygons } = usePolygons();

  // Effect for initial map setup - runs only once
  useEffect(() => {
    if (!mapRef.current) return;

    // Create WFS vector source for polygons
    const polygonSource = new VectorSource({
      format: new GeoJSON(),
      url: function() {
        return (
          '/wms-proxy/cgi-bin/qgis_mapserv.fcgi' +
          '?map=/home/qgis/to_show_april3/to_show_april3/april4.qgz' +
          '&service=WFS' +
          '&version=1.1.0' +
          '&request=GetFeature' +
          '&typename=ExamplePolygons' +
          '&outputFormat=application/json' +
          '&srsname=EPSG:3857'
        );
      },
      strategy: bboxStrategy
    });
    vectorSourceRef.current = polygonSource;

    // Style for the polygons
    const polygonStyle = new Style({
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0)'
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.5)',
        width: 1
      })
    });

    // Create vector layer for polygons
    const polygonLayer = new VectorLayer({
      source: polygonSource,
      style: polygonStyle,
      name: 'vector_polygons'
    });

    // Create the raster layers
    const raster1Layer = new ImageLayer({
      source: new ImageWMS({
        url: '/wms-proxy/cgi-bin/qgis_mapserv.fcgi',
        params: {
          MAP: '/home/qgis/to_show_april3/to_show_april3/april4.qgz',
          LAYERS: 'Alena_1,Ardill_1,Caltech_1,Duncan_1,Highschool_1,Jackson_1,Kentstate_1,Maurath_1,Nana_1,Ohiostate_1',
          FORMAT: 'image/png',
          SERVICE: 'WMS',
          VERSION: '1.3.0',
          REQUEST: 'GetMap',
          CRS: 'EPSG:3857',
          TRANSPARENT: true
        },
        ratio: 1,
        serverType: 'qgis',
        crossOrigin: 'anonymous'
      }),
      name: 'dummy_data_rasters_1',
      visible: layerStates.raster1
    });
    
    const raster2Layer = new ImageLayer({
      source: new ImageWMS({
        url: '/wms-proxy/cgi-bin/qgis_mapserv.fcgi',
        params: {
          MAP: '/home/qgis/to_show_april3/to_show_april3/april4.qgz',
          LAYERS: 'Alena_2,Ardill_2,Caltech_2,Duncan_2,Highschool_2,Jackson_2,Kentstate_2,Maurath_2,Nana_2,Ohiostate_2',
          FORMAT: 'image/png',
          SERVICE: 'WMS',
          VERSION: '1.3.0',
          REQUEST: 'GetMap',
          CRS: 'EPSG:3857',
          TRANSPARENT: true
        },
        ratio: 1,
        serverType: 'qgis',
        crossOrigin: 'anonymous'
      }),
      name: 'dummy_data_rasters_2',
      visible: layerStates.raster2
    });

    // Store references to the raster layers
    layersRef.current.raster1 = raster1Layer;
    layersRef.current.raster2 = raster2Layer;

    // Define map layers
    const layers = [
      new TileLayer({
        source: new OSM(),
      }),
      raster1Layer,
      raster2Layer,
      new ImageLayer({
        source: new ImageWMS({
          url: '/wms-proxy/cgi-bin/qgis_mapserv.fcgi',
          params: {
            MAP: '/home/qgis/to_show_april3/to_show_april3/april4.qgz',
            LAYERS: 'ExamplePolygons,randomLines,HydrogenData',
            FORMAT: 'image/png',
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            REQUEST: 'GetMap',
            CRS: 'EPSG:3857',
            TRANSPARENT: true
          },
          ratio: 1,
          serverType: 'qgis',
          crossOrigin: 'anonymous'
        }),
        name: 'dummy_data_vectors',
        visible: true
      }),
      polygonLayer
    ];

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: layers,
      view: new View({
        center: [0, 0],
        zoom: 2,
        projection: 'EPSG:3857',
      }),
    });

    mapInstanceRef.current = map;

    // Handle cursor changes on hover
    const handlePointerMove = (evt) => {
      if (evt.dragging) return;

      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, {
        layerFilter: function(layer) {
          return layer === polygonLayer;
        }
      });

      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    };

    map.on('pointermove', handlePointerMove);

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        map.un('pointermove', handlePointerMove);
      }
    };
  }, []); // Empty dependency array - runs only once

  // Effect to handle layer visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (layersRef.current.raster1) {
      layersRef.current.raster1.setVisible(layerStates.raster1);
    }
    
    if (layersRef.current.raster2) {
      layersRef.current.raster2.setVisible(layerStates.raster2);
    }
  }, [layerStates]); // Depend on layerStates

  // Effect to handle zooming to active polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !vectorSourceRef.current || !activePolygons?.length) return;

    const zoomToFeature = (feature) => {
      if (!feature) return;
      
      const geometry = feature.getGeometry();
      const extent = geometry.getExtent();
      
      // Add some padding around the extent
      const padding = 50;
      mapInstanceRef.current.getView().fit(extent, {
        padding: [padding, padding, padding, padding],
        duration: 1000  // Animation duration in milliseconds
      });
    };

    // Function to handle features being loaded
    const handleFeaturesLoaded = (event) => {
      const selectedPolygon = activePolygons[activePolygons.length - 1];
      
      // Find the matching feature by name
      const matchingFeature = event.features.find(feature => 
        feature.get('AOIName') === selectedPolygon.name
      );

      if (matchingFeature) {
        zoomToFeature(matchingFeature);
      }
    };

    // Check if features are already loaded
    const features = vectorSourceRef.current.getFeatures();
    if (features.length > 0) {
      const selectedPolygon = activePolygons[activePolygons.length - 1];
      const matchingFeature = features.find(feature => 
        feature.get('AOIName') === selectedPolygon.name
      );
      
      if (matchingFeature) {
        zoomToFeature(matchingFeature);
      }
    }

    // Listen for features being loaded
    vectorSourceRef.current.on('featuresloadend', handleFeaturesLoaded);

    // Cleanup
    return () => {
      if (vectorSourceRef.current) {
        vectorSourceRef.current.un('featuresloadend', handleFeaturesLoaded);
      }
    };
  }, [activePolygons]); // Only depends on activePolygons

  return (
    <div className='w-full h-full rounded-md overflow-hidden'>
      <div 
        ref={mapRef} 
        className='w-full h-full rounded-md'
      />
    </div>
  );
}