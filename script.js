window.addEventListener("load", function () {
    var map = L.map("map").setView([45.523062, -122.676482], 13);
  
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        var heatLayer = L.heatLayer(data.map((item) => [item.lat, item.lng]), {
          radius: 25,
          blur: 15,
          minOpacity: 0.05,
        }).addTo(map);
  
        var markersLayer = L.layerGroup();
        data.forEach((item) => {
          var marker = L.marker([item.lat, item.lng], {
            icon: L.divIcon({ className: "marker-icon" }),
          });
          markersLayer.addLayer(marker);
        });
  
        document.getElementById("mapType").addEventListener("change", function () {
          if (this.value === "heat") {
            markersLayer.remove();
            heatLayer.addTo(map);
            displayHeatOptions(true);
          } else if (this.value === "markers") {
            heatLayer.remove();
            markersLayer.addTo(map);
            displayHeatOptions(false);
          }
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
  
          var filteredData = data.filter((item) => {
            var itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
          });
  
          if (mapLayerValue === "heat") {
            heatLayer.setOptions({ radius: radius, blur: blur, minOpacity: minOpacity });
            heatLayer.setLatLngs(filteredData.map((item) => [item.lat, item.lng]));
            heatLayer.addTo(map);
            markersLayer.remove();
          } else if (mapLayerValue === "markers") {
            heatLayer.remove();
            markersLayer.clearLayers();
            filteredData.forEach((item) => {
              var marker = L.marker([item.lat, item.lng]);
              markersLayer.addLayer(marker);
            });
            markersLayer.addTo(map);
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

  