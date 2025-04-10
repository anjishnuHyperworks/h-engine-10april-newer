import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Polygon as OLPolygon, Circle as OLCircle, Point } from 'ol/geom';
import LineString from 'ol/geom/LineString'; 
import { Style, Stroke, Fill, Circle } from 'ol/style';
import { defaults } from 'ol/interaction';

const PolygonCoordinates = {
    coordinates: Array
};

const Line1DShapeType = ['zigzag', 'spiral', 'wave', 'random', 'stair'];
const Shape2DType = ['circle', 'rectangle', 'triangle', 'hexagon', 'random-polygon', 'trapezoid'];

export function MapSection({ selectedPolygon, layerStates }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const polygonLayerRef = useRef(null);
    const layer1ShapeRef = useRef(null);
    const layer2ShapeRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return;
        // Initialize OpenLayers map
        const map = new Map({
        target: mapRef.current,
        layers: [
            new TileLayer({
            source: new OSM()
            })
        ],
        view: new View({
            center: fromLonLat([-74, 40.7]), // Default center
            zoom: 12
        }),
        // Disable mouse wheel zoom by configuring interactions
        interactions: defaults({
            mouseWheelZoom: false  // This disables scroll wheel zooming
        })
        
        });

        // Create vector layer for polygons
        const polygonLayer = new VectorLayer({
        source: new VectorSource()
        });
        map.addLayer(polygonLayer);

        // Create vector layer for Layer1 shapes (1D Lines)
        const layer1Shape = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            stroke: new Stroke({
            color: 'blue',
            width: 2
            })
        })
        });
        map.addLayer(layer1Shape);

        // Create vector layer for Layer2 shapes (2D Shapes)
        const layer2Shape = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            stroke: new Stroke({
            color: 'green',
            width: 2
            }),
            fill: new Fill({
            color: 'rgba(0, 255, 0, 0.2)'
            })
        })
        });
        map.addLayer(layer2Shape);

        mapInstanceRef.current = map;
        polygonLayerRef.current = polygonLayer;
        layer1ShapeRef.current = layer1Shape;
        layer2ShapeRef.current = layer2Shape;

        return () => {
        map.setTarget(undefined);
        };
    }, []);

    // Update polygon on map when selected
    useEffect(() => {
        if (!mapInstanceRef.current || !polygonLayerRef.current || !selectedPolygon) return;
        const vectorSource = polygonLayerRef.current.getSource();
        if (!vectorSource) return;

        // Clear existing features
        vectorSource.clear();

        // Type assertion for coordinates (assumes a valid format from the server)
        const polygonCoords = selectedPolygon.coordinates;
        if (!polygonCoords || !polygonCoords[0]) return;

        // Convert coordinates to OpenLayers format
        const coordinates = polygonCoords[0].map((coord) => 
        fromLonLat([coord[0], coord[1]])
        );

        // Create polygon feature
        const polygonFeature = new Feature({
        geometry: new OLPolygon([coordinates])
        });
        vectorSource.addFeature(polygonFeature);

        // Fit view to polygon - reduce animation duration for faster transitions
        const extent = vectorSource.getExtent();
        mapInstanceRef.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000
        });
    }, [selectedPolygon]);

    // Handle Layer1 toggle - show/hide 1D shapes
    useEffect(() => {
        if (!layer1ShapeRef.current || !selectedPolygon) return;
        
        const shapeSource = layer1ShapeRef.current.getSource();
        if (!shapeSource) return;
        
        // Clear existing features
        shapeSource.clear();
        
        // Only add shape if Layer1 is enabled
        if (layerStates.layer1) {
        // Determine the shape type based on polygon ID
        const polygonId = selectedPolygon.id || 0;
        const shapeType = get1DShapeTypeForPolygon(polygonId);
        
        // Generate a shape based on the polygon's ID
        const shapeFeatures = generate1DShapeForPolygon(selectedPolygon, shapeType);
        
        // Add the shapes to the source
        shapeFeatures.forEach(feature => {
            shapeSource.addFeature(feature);
        });
        }
    }, [selectedPolygon, layerStates.layer1]);

     // Handle Layer2 toggle - show/hide 2D shapes
    useEffect(() => {
        if (!layer2ShapeRef.current || !selectedPolygon) return;
        
        const shapeSource = layer2ShapeRef.current.getSource();
        if (!shapeSource) return;
        
        // Clear existing features
        shapeSource.clear();
        
        // Only add shape if Layer2 is enabled
        if (layerStates.layer2) {
        // Determine the shape type based on polygon ID
        const polygonId = selectedPolygon.id || 0;
        const shapeType = get2DShapeTypeForPolygon(polygonId);
        
        // Generate a shape based on the polygon's ID
        const shapeFeatures = generate2DShapeForPolygon(selectedPolygon, shapeType);
        
        // Add the shapes to the source
        shapeFeatures.forEach(feature => {
            shapeSource.addFeature(feature);
        });
        }
    }, [selectedPolygon, layerStates.layer2]);

    // Determine 1D shape type based on polygon ID
    const get1DShapeTypeForPolygon = (polygonId) => {
        // Special cases for polygons B (ID 2) and G (ID 7) - avoid sinusoidal shapes
        if (polygonId === 2) {
        return 'stair'; // Use stair shape for polygon B
        }
        
        if (polygonId === 7) {
        return 'random'; // Use random line shape for polygon G
        }
        
        const shapeTypes = ['zigzag', 'spiral', 'wave', 'random', 'stair'];
        return shapeTypes[polygonId % shapeTypes.length];
    };

    // Determine 2D shape type based on polygon ID
    const get2DShapeTypeForPolygon = (polygonId) => {
        // Special cases: Polygon E (ID 5) and Polygon J (ID 10) should be trapezoids
        if (polygonId === 5 || polygonId === 10) {
        return 'trapezoid';
        }
        
        const shapeTypes = ['circle', 'rectangle', 'triangle', 'hexagon', 'random-polygon'];
        return shapeTypes[polygonId % shapeTypes.length];
    };

    // Generate 1D shape features based on polygon and shape type
    const generate1DShapeForPolygon = (polygon, shapeType) => {
        // Type assertion for coordinates
        const polygonCoords = polygon.coordinates;
        if (!polygonCoords || !polygonCoords[0]) {
        return [];
        }
        
        // Get polygon bounds
        const bounds = getBounds(polygonCoords[0]);
        
        // Use polygon ID as seed for consistent randomness per polygon
        const seed = polygon.id || 1;
        
        // Array to hold generated features
        const features = [];
        
        switch(shapeType) {
        case 'zigzag':
            features.push(generateZigZagFeature(bounds, seed));
            break;
        case 'spiral':
            features.push(generateSpiralFeature(bounds, seed));
            break;
        case 'wave':
            features.push(generateWaveFeature(bounds, seed));
            break;
        case 'random':
            features.push(generateRandomLineFeature(bounds, seed));
            break;
        case 'stair':
            features.push(generateStairFeature(bounds, seed));
            break;
        default:
            features.push(generateZigZagFeature(bounds, seed));
        }
        
        return features;
    };

    // Generate 2D shape features based on polygon and shape type
    const generate2DShapeForPolygon = (polygon, shapeType) => {
        // Type assertion for coordinates
        const polygonCoords = polygon.coordinates;
        if (!polygonCoords || !polygonCoords[0]) {
        return [];
        }
        
        // Get polygon bounds
        const bounds = getBounds(polygonCoords[0]);
        
        // Use polygon ID as seed for consistent randomness per polygon
        const seed = polygon.id || 1;
        
        // Array to hold generated features
        const features = [];
        
        switch(shapeType) {
        case 'circle':
            features.push(...generateCircleFeatures(bounds, seed));
            break;
        case 'rectangle':
            features.push(generateRectangleFeature(bounds, seed));
            break;
        case 'triangle':
            features.push(generateTriangleFeature(bounds, seed));
            break;
        case 'hexagon':
            features.push(generateHexagonFeature(bounds, seed));
            break;
        case 'random-polygon':
            features.push(generateRandomPolygonFeature(bounds, seed));
            break;
        case 'trapezoid':
            features.push(generateTrapezoidFeature(bounds, seed));
            break;
        default:
            features.push(...generateCircleFeatures(bounds, seed));
        }
        
        return features;
    };

    // Generate a zig-zag line feature
    const generateZigZagFeature = (bounds, seed) => {
        // Generate points for zig-zag line
        const pointCount = 10 + (seed % 8); // 10-17 points based on ID
        const points = [];
        
        // Starting point - somewhere in the left part of the polygon
        const startX = bounds.minX + (bounds.maxX - bounds.minX) * 0.1;
        const startY = bounds.minY + (bounds.maxY - bounds.minY) * 0.5;
        points.push(fromLonLat([startX, startY]));
        
        // Generate remaining zig-zag points
        for (let i = 1; i < pointCount; i++) {
        // Alternate between moving right-up and right-down
        const xStep = (bounds.maxX - bounds.minX) * 0.8 / (pointCount - 1);
        const x = startX + i * xStep;
        
        // Alternate direction based on even/odd index and polygon ID
        const direction = (i % 2 === 0) !== (seed % 2 === 0) ? 1 : -1;
        
        // Vary the amplitude based on polygon ID
        const amplitude = (bounds.maxY - bounds.minY) * 0.3 * (1 + (seed % 5) * 0.1);
        
        // Calculate y with progressive amplitude
        const progressFactor = i / (pointCount - 1); // 0 to 1
        const y = startY + direction * amplitude * Math.sin(progressFactor * Math.PI * (1 + seed % 3));
        
        points.push(fromLonLat([x, y]));
        }
        
        // Create and return the zig-zag feature
        return new Feature({
        geometry: new LineString(points)
        });
    };

    // Generate a spiral shape feature
    const generateSpiralFeature = (bounds, seed) => {
        // Find center of polygon
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
        
        // Determine size of spiral based on polygon bounds
        const maxDimension = Math.min(
        bounds.maxX - bounds.minX,
        bounds.maxY - bounds.minY
        ) * 0.4;
        
        // Number of rotations influenced by seed
        const rotations = 2 + (seed % 3);
        
        // Number of points in the spiral - reduced for better performance
        const pointCount = 30 + (seed % 20); // Reduced from 50+seed%50 to 30+seed%20
        
        // Generate spiral points
        const points = [];
        for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2 * rotations;
        const radius = (i / pointCount) * maxDimension;
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        points.push(fromLonLat([x, y]));
        }
        
        // Create and return the spiral feature
        return new Feature({
        geometry: new LineString(points)
        });
    };

    // Generate a wave line feature
    const generateWaveFeature = (bounds, seed) => {
        // Reduced point count for better performance
        const pointCount = 50; // Reduced from 100 to 50
        const points = [];
        
        // Wave properties based on seed
        const frequency = 1 + (seed % 5);
        const amplitude = (bounds.maxY - bounds.minY) * 0.2 * (1 + (seed % 3) * 0.1);
        
        // Generate wave points across the polygon
        for (let i = 0; i < pointCount; i++) {
        const progress = i / (pointCount - 1);
        const x = bounds.minX + progress * (bounds.maxX - bounds.minX);
        const y = bounds.minY + (bounds.maxY - bounds.minY) * 0.5 + 
                    amplitude * Math.sin(progress * Math.PI * 2 * frequency);
        
        points.push(fromLonLat([x, y]));
        }
        
        return new Feature({
        geometry: new LineString(points)
        });
    };

    // Generate a random line feature
    const generateRandomLineFeature = (bounds, seed) => {
        // Number of points in the random line
        const pointCount = 10 + (seed % 10);
        const points = [];
        
        // Initialize a pseudorandom generator with the seed
        const random = (min, max) => {
        const x = Math.sin(seed + points.length) * 10000;
        const r = x - Math.floor(x);
        return min + r * (max - min);
        };
        
        // Starting point
        const startX = bounds.minX + (bounds.maxX - bounds.minX) * 0.1;
        const startY = bounds.minY + (bounds.maxY - bounds.minY) * 0.5;
        points.push(fromLonLat([startX, startY]));
        
        // Generate random points
        for (let i = 1; i < pointCount; i++) {
        const x = bounds.minX + random(0, bounds.maxX - bounds.minX);
        const y = bounds.minY + random(0, bounds.maxY - bounds.minY);
        points.push(fromLonLat([x, y]));
        }
        
        return new Feature({
        geometry: new LineString(points)
        });
    };

    // Generate a stair-step line feature
    const generateStairFeature = (bounds, seed) => {
        // Number of steps
        const stepCount = 4 + (seed % 5);
        const points = [];
        
        // Starting point
        const startX = bounds.minX + (bounds.maxX - bounds.minX) * 0.1;
        const startY = bounds.minY + (bounds.maxY - bounds.minY) * 0.1;
        points.push(fromLonLat([startX, startY]));
        
        // Steps going up and right
        const stepWidth = (bounds.maxX - bounds.minX) * 0.8 / stepCount;
        const stepHeight = (bounds.maxY - bounds.minY) * 0.8 / stepCount;
        
        for (let i = 0; i < stepCount; i++) {
        // Horizontal segment
        points.push(fromLonLat([startX + (i + 1) * stepWidth, startY + i * stepHeight]));
        
        // Vertical segment (if not the last step)
        if (i < stepCount - 1) {
            points.push(fromLonLat([startX + (i + 1) * stepWidth, startY + (i + 1) * stepHeight]));
        }
        }
        
        return new Feature({
        geometry: new LineString(points)
        });
    };

    // Generate multiple circle features (2D)
    const generateCircleFeatures = (bounds, seed) => {
        const features = [];
        
        // Find center of polygon
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
        
        // Maximum radius based on polygon size - reduced to 30% to stay within bounds
        const maxRadius = Math.min(
        (bounds.maxX - bounds.minX),
        (bounds.maxY - bounds.minY)
        ) * 0.3;
        
        // Reduce number of circles for performance
        const circleCount = 2 + (seed % 2); // Reduced from 2+(seed%3) to 2+(seed%2)
        
        // Create concentric circles
        for (let i = 1; i <= circleCount; i++) {
        const radius = (i / circleCount) * maxRadius;
        
        // Convert center to OpenLayers coordinates
        const center = fromLonLat([centerX, centerY]);
        
        // Create polygon approximation of circle
        // Reduced point count for better performance
        const pointCount = 36; // Reduced from 60 to 36 (still smooth enough)
        const circlePoints = [];
        
        for (let j = 0; j <= pointCount; j++) {
            const angle = (j / pointCount) * Math.PI * 2;
            // Calculate point on circle
            const x = center[0] + radius * 10000 * Math.cos(angle);
            const y = center[1] + radius * 10000 * Math.sin(angle);
            
            circlePoints.push([x, y]);
        }
        
        // For Layer 2, create polygon rather than line
        features.push(new Feature({
            geometry: new OLPolygon([circlePoints])
        }));
        }
        
        return features;
    };

    // Generate a rectangle feature (2D)
    const generateRectangleFeature = (bounds, seed) => {
        // Size of rectangle as percentage of polygon size - reduced max size
        const widthRatio = 0.2 + (seed % 4) * 0.1; // 20-50% of polygon width
        const heightRatio = 0.2 + ((seed + 2) % 4) * 0.1; // 20-50% of polygon height
        
        // Rectangle dimensions
        const width = (bounds.maxX - bounds.minX) * widthRatio;
        const height = (bounds.maxY - bounds.minY) * heightRatio;
        
        // Center position with reduced offset based on seed
        const offsetX = ((seed % 3) - 1) * 0.05; // -0.05 to 0.05
        const offsetY = (((seed + 3) % 3) - 1) * 0.05; // -0.05 to 0.05
        
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) * (0.5 + offsetX);
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) * (0.5 + offsetY);
        
        // Rectangle corner points
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        const points = [
        [centerX - halfWidth, centerY - halfHeight],
        [centerX + halfWidth, centerY - halfHeight],
        [centerX + halfWidth, centerY + halfHeight],
        [centerX - halfWidth, centerY + halfHeight],
        [centerX - halfWidth, centerY - halfHeight] // Close the polygon
        ].map(point => fromLonLat(point));
        
        return new Feature({
        geometry: new OLPolygon([points])
        });
    };

    // Generate a triangle feature (2D)
    const generateTriangleFeature = (bounds, seed) => {
        // Find center of polygon with reduced randomness
        const offsetX = ((seed % 3) - 1) * 0.05; // -0.05 to 0.05
        const offsetY = (((seed + 1) % 3) - 1) * 0.05; // -0.05 to 0.05
        
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) * (0.5 + offsetX);
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) * (0.5 + offsetY);
        
        // Size of triangle - reduced to stay within bounds
        const size = Math.min(
        (bounds.maxX - bounds.minX),
        (bounds.maxY - bounds.minY)
        ) * (0.2 + (seed % 3) * 0.1); // 20-40% of polygon size
        
        // Triangle points (3 vertices + closure)
        const rotation = (seed % 6) * Math.PI / 3; // Random rotation
        
        const points = [
        // Three vertices of the triangle
        [
            centerX + size * Math.cos(rotation),
            centerY + size * Math.sin(rotation)
        ],
        [
            centerX + size * Math.cos(rotation + (2 * Math.PI / 3)),
            centerY + size * Math.sin(rotation + (2 * Math.PI / 3))
        ],
        [
            centerX + size * Math.cos(rotation + (4 * Math.PI / 3)),
            centerY + size * Math.sin(rotation + (4 * Math.PI / 3))
        ],
        // Close the polygon
        [
            centerX + size * Math.cos(rotation),
            centerY + size * Math.sin(rotation)
        ]
        ].map(point => fromLonLat(point));
        
        return new Feature({
        geometry: new OLPolygon([points])
        });
    };

    // Generate a hexagon feature (2D)
    const generateHexagonFeature = (bounds, seed) => {
        // Find center of polygon with reduced randomness
        const offsetX = ((seed % 3) - 1) * 0.05; // -0.05 to 0.05
        const offsetY = (((seed + 2) % 3) - 1) * 0.05; // -0.05 to 0.05
        
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) * (0.5 + offsetX);
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) * (0.5 + offsetY);
        
        // Size of hexagon - reduced to stay within bounds
        const size = Math.min(
        (bounds.maxX - bounds.minX),
        (bounds.maxY - bounds.minY)
        ) * (0.2 + (seed % 3) * 0.1); // 20-40% of polygon size
        
        // Hexagon points (6 vertices + closure)
        const rotation = (seed % 6) * Math.PI / 6; // Random rotation
        const points = [];
        
        // Create 6 vertices
        for (let i = 0; i <= 6; i++) {
        const angle = rotation + (i % 6) * (Math.PI / 3);
        const x = centerX + size * Math.cos(angle);
        const y = centerY + size * Math.sin(angle);
        points.push(fromLonLat([x, y]));
        }
        
        return new Feature({
        geometry: new OLPolygon([points])
            });
        };

    // Generate a random polygon feature (2D)
    const generateRandomPolygonFeature = (bounds, seed) => {
        // Reduced number of vertices for better performance
        const vertexCount = 5 + (seed % 3); // Reduced from 5+(seed%4) to 5+(seed%3)
        
        // Find center of polygon with reduced randomness
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) * 0.5;
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) * 0.5;
        
        // Maximum radius for vertices - reduced to stay within bounds
        const maxRadius = Math.min(
            (bounds.maxX - bounds.minX),
            (bounds.maxY - bounds.minY)
        ) * 0.25; // Reduced to 25% of polygon size
        
        // Generate random vertices around center
        const points = [];
        for (let i = 0; i <= vertexCount; i++) {
            // Use modulo for the last point to close the polygon
            const idx = i % vertexCount;
            
            // Angle around the center
            const angle = (idx / vertexCount) * Math.PI * 2;
            
            // Random radius between 60-90% of max (more conservative range)
            const radiusFactor = 0.6 + Math.abs(Math.sin(seed + idx * 3) * 0.3);
            const radius = maxRadius * radiusFactor;
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            points.push(fromLonLat([x, y]));
        }
        return new Feature({geometry: new OLPolygon([points])});
    };

    // Generate a trapezoid feature (2D)
    const generateTrapezoidFeature = (bounds, seed) => {
        // Find center of polygon with minimal randomness
        const offsetX = 0; // No horizontal offset to keep centered
        const offsetY = ((seed % 3) - 1) * 0.03; // Very small vertical offset
        
        const centerX = bounds.minX + (bounds.maxX - bounds.minX) * (0.5 + offsetX);
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) * (0.5 + offsetY);
        
        // Size of trapezoid - conservative to stay within bounds
        const width = (bounds.maxX - bounds.minX) * 0.25;
        const height = (bounds.maxY - bounds.minY) * 0.25;
        
        // Top width is narrower than bottom width (creating the trapezoid)
        // Ratio of top width to bottom width varies slightly based on seed
        const topWidthRatio = 0.5 + (seed % 3) * 0.1; // 50-70% of bottom width
        
        // Calculate corner points
        const bottomHalfWidth = width / 2;
        const topHalfWidth = bottomHalfWidth * topWidthRatio;
        
        // Trapezoid orientation depends on seed (which way the narrow part points)
        let points;
        
        if (seed % 2 === 0) {
        // Narrow at top
        points = [
            [centerX - bottomHalfWidth, centerY - height/2], // Bottom left
            [centerX + bottomHalfWidth, centerY - height/2], // Bottom right
            [centerX + topHalfWidth, centerY + height/2],    // Top right
            [centerX - topHalfWidth, centerY + height/2],    // Top left
            [centerX - bottomHalfWidth, centerY - height/2]  // Close the polygon
        ];
        } else {
        // Narrow at bottom
        points = [
            [centerX - topHalfWidth, centerY - height/2],    // Bottom left
            [centerX + topHalfWidth, centerY - height/2],    // Bottom right
            [centerX + bottomHalfWidth, centerY + height/2], // Top right
            [centerX - bottomHalfWidth, centerY + height/2], // Top left
            [centerX - topHalfWidth, centerY - height/2]     // Close the polygon
        ];
        }
        
        // Convert to OpenLayers coordinates
        const olPoints = points.map(point => fromLonLat(point));
        
        return new Feature({
        geometry: new OLPolygon([olPoints])
        });
    };

    // Helper to get bounds of a polygon
    const getBounds = (coordinates) => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        coordinates.forEach((coord) => {
        minX = Math.min(minX, coord[0]);
        maxX = Math.max(maxX, coord[0]);
        minY = Math.min(minY, coord[1]);
        maxY = Math.max(maxY, coord[1]);
        });
        
        return { minX, maxX, minY, maxY };
    };

    return (
        <div className='w-full h-full rounded-md overflow-hidden'>
            <div 
                ref={mapRef} 
                className='w-full h-full rounded-md'
            />
        </div>
    );
}