document.addEventListener("DOMContentLoaded", function () {
    const highlightStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({ color: 'yellow' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 2 }),
        }),
    });

    let selectedFeature;
    let previouslySelectedFeature;

    // Initialize the map
    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://cawm.lib.uiowa.edu/tiles/{z}/{x}/{y}.png',
                }),
            }),
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([20, 35]),
            zoom: 6,
        }),
    });


    // Style function based on Ftr_Type
    const styleFunction = (feature) => {
        const ftrType = feature.get('Ftr_Type');
        let style;

        if (ftrType === 'town') {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: 'white' }),
                    stroke: new ol.style.Stroke({ color: 'black', width: 1 }), // Add the black outline
                }),
            });
        } else if (ftrType === 'mountain') {
            style = new ol.style.Style({
                image: new ol.style.RegularShape({
                    points: 3,
                    radius: 8,
                    fill: new ol.style.Fill({ color: 'black' }),
                }),
            });
        } else {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: 'black' }),
                }),
            });
        }

        return style;
    };

    const vectorSource = new ol.source.Vector({
        url: 'points.geojson',
        format: new ol.format.GeoJSON(),
    });

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: styleFunction,
    });

    map.addLayer(vectorLayer);

    const lineStyleFunction = (feature) => {
        const ftrType = feature.get('Ftr_Type');
        const mapEntry = feature.get('Map_Entry');

        let style;

        if (ftrType === 'road') {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 2,
                }),
                text: new ol.style.Text({
                    text: mapEntry, // Use Map_Entry as the label text
                    fill: new ol.style.Fill({ color: 'black' }),
                    font: '12px Arial',
                    placement: 'line', // Place the label along the line
                    maxAngle: 0.4, // Adjust to control label orientation
                }),
            });
        } else if (ftrType === 'river') {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'cyan',
                    width: 3,
                }),
                text: new ol.style.Text({
                    text: mapEntry, // Use Map_Entry as the label text
                    fill: new ol.style.Fill({ color: 'black' }),
                    font: '12px Arial',
                    placement: 'line', // Place the label along the line
                    maxAngle: 0.4, // Adjust to control label orientation
                }),
            });
        } else {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'gray',
                    width: 1,
                }),
                text: new ol.style.Text({
                    text: mapEntry, // Use Map_Entry as the label text
                    fill: new ol.style.Fill({ color: 'black' }),
                    font: '12px Arial',
                    placement: 'line', // Place the label along the line
                    maxAngle: 0.4, // Adjust to control label orientation
                }),
            });
        }

        // Check if the feature is the selected one
        if (selectedFeature === feature) {
            style = highlightStyle; // Apply the highlight style
        }

        return style;
    };

    const lineVectorSource = new ol.source.Vector({
        url: 'lines.geojson', // Replace with your line GeoJSON URL
        format: new ol.format.GeoJSON(),
    });

    const lineVectorLayer = new ol.layer.Vector({
        source: lineVectorSource,
        style: lineStyleFunction,
    });

    map.addLayer(lineVectorLayer);

    const overlay = new ol.Overlay({
        element: document.getElementById('popup'),
        autoPan: true,
        autoPanAnimation: {
            duration: 250,
        },
    });
    map.addOverlay(overlay);

    const popupContent = document.getElementById('popup-content');
    const popupCloser = document.getElementById('popup-closer');

    popupCloser.onclick = function () {
        overlay.setPosition(undefined);
        popupCloser.blur();
        return false;
    };



    // Show the searchable index overlay when "Searchable Index" link is clicked
    const overlayElement = document.getElementById('overlay');
    const overlayCloser = document.getElementById('overlay-closer');
    const searchLink = document.getElementById('searchLink');

    searchLink.addEventListener('click', function () {
        overlayElement.style.display = 'block';
    });

    overlayCloser.addEventListener('click', function () {
        overlayElement.style.display = 'none';
    });

    
    map.on('click', function (event) {
        const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
        if (feature) {
            const properties = feature.getProperties();
            const content = `
                <ul>
                    <li><strong>Map_Entry:</strong> ${properties.Map_Entry}</li>
                    <li><strong>Ftr_Type:</strong> ${properties.Ftr_Type}</li>
                    <li><strong>BA_1:</strong> ${properties.BA_1}</li>
                    <li><strong>Dir_entry1:</strong> ${properties.Dir_entry1}</li>
                </ul>
            `;
            popupContent.innerHTML = content;
            overlay.setPosition(event.coordinate);

            if (selectedFeature) {
                selectedFeature.setStyle(styleFunction(selectedFeature)); // Reset style
            }

            selectedFeature = feature;
            selectedFeature.setStyle(highlightStyle); // Apply highlight style
        } else {
            overlay.setPosition(undefined);

            if (selectedFeature) {
                selectedFeature.setStyle(styleFunction(selectedFeature)); // Reset style
                selectedFeature = null;
            }
        }
    });

    const select = new ol.interaction.Select({
        layers: [lineVectorLayer], // Specify the line layer
        condition: ol.events.condition.click,
    });

    map.addInteraction(select);

    select.on('select', function (event) {
        const selectedFeatures = event.selected;
    
        if (selectedFeatures.length > 0) {
            const selectedFeature = selectedFeatures[0];
    
            // Handle the selected feature (line or label)
            const mapEntry = selectedFeature.get('Map_Entry');
            console.log('Selected:', mapEntry);
    
            // Apply bright yellow style to the selected feature
            selectedFeature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'yellow', // Use bright yellow color
                    width: 3, // Adjust as needed
                }),
            }));
    
            // Reset the style of the previously selected feature
            if (previouslySelectedFeature) {
                previouslySelectedFeature.setStyle(lineStyleFunction(previouslySelectedFeature));
            }
            previouslySelectedFeature = selectedFeature;
        } else {
            // No selected features
            console.log('Nothing selected.');
    
            // Reset the style of the previously selected feature
            if (previouslySelectedFeature) {
                previouslySelectedFeature.setStyle(lineStyleFunction(previouslySelectedFeature));
            }
            previouslySelectedFeature = null;
        }
    });
    
    
    
});
