window.addEventListener("load", function () {
    var map = L.map("map").setView([45.523062, -122.676482], 13);
    const info = L.control();

// info.onAdd = function (map) {
//     this._div = L.DomUtil.create('div', 'info');
//     this.update();
//     return this._div;
// };

// info.update = function (props) {
//     this._div.innerHTML = '<h4>Neighborhood Information</h4>' + (props ?
//         '<b>' + props.NAME + '</b><br />Incidents: ' + (incidentCounts[props.NAME] || 0) :
//         'Hover over a neighborhood');
// };

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    var heatLayer, markersLayer, choroplethLayer;

    fetch("data.json")
        .then((response) => response.json())
        .then((data) => {
            heatLayer = L.heatLayer(data.map((item) => [item.lat, item.lng]), {
                radius: 25,
                blur: 15,
                minOpacity: 0.05,
            });

            markersLayer = L.layerGroup();
            data.forEach((item) => {
                var redIcon = L.icon({
                    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                var marker = L.marker([item.lat, item.lng], { icon: redIcon });
                markersLayer.addLayer(marker);
            });

            // Fetch GeoJSON data
            fetch("neighborhoods.geojson")
                .then((response) => response.json())
                .then((geojsonData) => {
                    choroplethLayer = createChoroplethLayer(geojsonData, data);
                    updateMap();
                })
                .catch((error) => {
                    console.error("Error fetching geojson data:", error);
                });

                function createChoroplethLayer(geojsonData, data) {
                    const incidentCounts = getIncidentCountsByNeighborhood(geojsonData, data);
                
                    // Define a color scale for the choropleth map
                    const colorScale = chroma.scale("YlOrRd").domain([0, Math.max(...Object.values(incidentCounts))]);
                
                
                    //info.addTo(map);
                
                    function highlightFeature(e) {
                        if (document.getElementById("mapType").value === "choropleth") {
                            var layer = e.target;
                    
                            layer.setStyle({
                                weight: 5,
                                color: '#666',
                                dashArray: '',
                                fillOpacity: 0.7
                            });
                    
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                layer.bringToFront();
                            }
                    
                            info.update(layer.feature.properties);
                        }
                    }
                    
                    function resetHighlight(e) {
                        if (document.getElementById("mapType").value === "choropleth") {
                            choroplethLayer.resetStyle(e.target);
                            info.update();
                        }
                    }
                    
                
                    function onEachFeature(feature, layer) {
                        layer.bindTooltip(feature.properties.MAPLABEL + "<br>Incidents: " + (incidentCounts[feature.properties.MAPLABEL] || 0), {
                            permanent: false,
                            direction: "top",
                            className: "incident-count-tooltip",
                            sticky: true,
                        });
                    
                        layer.on({
                            mouseover: function (e) {
                                if (document.getElementById("mapType").value === "choropleth") {
                                    layer.openTooltip();
                                    highlightFeature(e);
                                }
                            },
                            mouseout: function (e) {
                                if (document.getElementById("mapType").value === "choropleth") {
                                    layer.closeTooltip();
                                    resetHighlight(e);
                                }
                            },
                        });
                    }
                    
                    
                    
                    
                
                    return L.geoJson(geojsonData, {
                        style: function (feature) {
                            const count = incidentCounts[feature.properties.MAPLABEL] || 0;
                            return {
                                fillColor: colorScale(count),
                                fillOpacity: 0.7,
                                weight: 2,
                                opacity: 1,
                                color: "white",
                            };
                        },
                        onEachFeature: onEachFeature,
                        interactive: true
                    });
                }
                
            function getIncidentCountsByNeighborhood(geojsonData, data) {
                const incidentCounts = {};

                data.forEach((incident) => {
                    const point = turf.point([incident.lng, incident.lat]);

                    geojsonData.features.forEach((feature) => {
                        if (turf.booleanPointInPolygon(point, feature)) {
                            const neighborhoodName = feature.properties.MAPLABEL;
                            incidentCounts[neighborhoodName] = (incidentCounts[neighborhoodName] || 0) + 1;
                        }
                    });
                });

                return incidentCounts;
            }

            document.getElementById("mapType").addEventListener("change", function () {
                updateMap();
            });

            function displayHeatOptions(show) {
                var heatOptions = document.querySelectorAll(".heat-controls");
                heatOptions.forEach((option) => {
                    option.style.display = show ? "block" : "none";
                });
            }

            function updateMap() {
                var radius = parseFloat(document.getElementById("radius").value);
                var blur = parseFloat(document.getElementById("blur").value);
                var minOpacity = parseFloat(document.getElementById("minOpacity").value);
                var startDate = new Date(document.getElementById("startDate").value);
                var endDate = new Date(document.getElementById("endDate").value);
                var mapLayerValue = document.getElementById("mapType").value;
                displayHeatOptions(mapLayerValue === "heat");
                var filteredData = data.filter((item) => {
                    var itemDate = new Date(item.date);
                    return itemDate >= startDate && itemDate <= endDate;
                });

                heatLayer.setOptions({ radius: radius, blur: blur, minOpacity: minOpacity });
                heatLayer.setLatLngs(filteredData.map((item) => [item.lat, item.lng]));

                markersLayer.clearLayers();
                filteredData.forEach((item) => {
                    var redIcon = L.icon({
                        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });

                    var marker = L.marker([item.lat, item.lng], { icon: redIcon });
                    markersLayer.addLayer(marker);
                });

                if (mapLayerValue === "heat") {
                    markersLayer.remove();
                    choroplethLayer.remove();
                    heatLayer.addTo(map);
                    displayHeatOptions(true);
                } else if (mapLayerValue === "markers") {
                    heatLayer.remove();
                    choroplethLayer.remove();
                    markersLayer.clearLayers();
                    filteredData.forEach((item) => {
                      // Create a simple red circle marker
                      var circleMarker = L.circleMarker([item.lat, item.lng], {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 1,
                        radius: 1
                      });
                      markersLayer.addLayer(circleMarker);
                    });
                    markersLayer.addTo(map);
                } else if (mapLayerValue === "choropleth") {
                    heatLayer.remove();
                    markersLayer.remove();
                    choroplethLayer.addTo(map);
                    displayHeatOptions(false);
                }
            }

            document.getElementById("radius").addEventListener("change", updateMap);
            document.getElementById("blur").addEventListener("change", updateMap);
            document.getElementById("minOpacity").addEventListener("change", updateMap);
            document.getElementById("startDate").addEventListener("change", updateMap);
            document.getElementById("endDate").addEventListener("change", updateMap);

            // Set initial min and max dates
            var minDate = new Date(Math.min.apply(null, data.map((item) => new Date(item.date))));
            var maxDate = new Date(Math.max.apply(null, data.map((item) => new Date(item.date))));
            document.getElementById("startDate").value = minDate.toISOString().split("T")[0];
            document.getElementById("endDate").value = maxDate.toISOString().split("T")[0];

            // Call updateMap initially to display the data correctly
            updateMap();

        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
});

