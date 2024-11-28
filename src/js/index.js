const provinceSelect = document.getElementById('provinceSelect');
const municipalitySelect = document.getElementById('municipalitySelect');
const fuelTypeSelect = document.getElementById('fuelTypeSelect');
const openNowCheckbox = document.getElementById('openNowCheckbox');
const gasStationsList = document.getElementById('gasStationsList');

const urlAPI = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/";
const endPointProvinces = "Listados/Provincias/";
const endPointMunicipalities = "Listados/MunicipiosPorProvincia/";
const endPointProducts = "Listados/ProductosPetroliferos/";
const endPointMunicipalitiesProducts = "EstacionesTerrestres/FiltroMunicipioProducto/";

// Fetch provinces
fetch(urlAPI + endPointProvinces)
  .then(response => response.json())
  .then(data => {
    data.forEach(province => {
      const option = document.createElement('option');
      option.value = province.IDPovincia;
      option.textContent = province.Provincia;
      provinceSelect.appendChild(option);
    });
  });

// Fetch municipalities based on selected province
provinceSelect.addEventListener('change', () => {
  municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';
  municipalitySelect.disabled = false;
  fetch(urlAPI + endPointMunicipalities + provinceSelect.value)
    .then(response => response.json())
    .then(data => {
      data.forEach(municipality => {
        const option = document.createElement('option');
        option.value = municipality.IDMunicipio;
        option.textContent = municipality.Municipio;
        municipalitySelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching municipalities:', error));
});

// Enable fuel type select when a municipality is selected
municipalitySelect.addEventListener('change', () => {
  if (municipalitySelect.value) {
    fuelTypeSelect.disabled = false;
  } else {
    fuelTypeSelect.disabled = true;
  }
});

// Fetch fuel types
fetch(urlAPI + endPointProducts)
  .then(response => response.json())
  .then(data => {
    const fuelTypes = {};

    // Iterate over each fuel type in the data array
    data.forEach(fuelType => {
      const fuelTypeId = fuelType.IDProducto;
      const fuelTypeName = fuelType.NombreProducto;

      // Add the fuel type to the fuelTypes object
      fuelTypes[fuelTypeId] = fuelTypeName;
    });

    // Add options to fuelTypeSelect
    for (const id in fuelTypes) {
      if (fuelTypes[id] !== undefined) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = fuelTypes[id];
        fuelTypeSelect.appendChild(option);
      }
    }
  })
  .catch(error => console.error('Error fetching data:', error));

// Fetch gas stations based on selected municipality and fuel type
fuelTypeSelect.addEventListener('change', () => {
  const selectedMunicipality = municipalitySelect.value;
  const selectedFuelType = fuelTypeSelect.value;

  if (selectedMunicipality && selectedFuelType) {
    fetch(urlAPI + endPointMunicipalitiesProducts + selectedMunicipality + "/" + selectedFuelType)
      .then(response => response.json())
      .then(data => {
        displayGasStations(data.ListaEESSPrecio);
      })
      .catch(error => console.error('Error fetching gas stations:', error));
  }
});

// Display gas stations in the DOM
function displayGasStations(stations) {
  gasStationsList.innerHTML = '';
  const openNow = openNowCheckbox.checked;
  const selectedFuelType = fuelTypeSelect.value;

  const filteredStations = stations.filter(station => {
    // Check if the selected fuel type is available at the station
    let hasFuel;
    if (selectedFuelType) {
      hasFuel = station.PrecioProducto;
    } else {
      hasFuel = true;
    }

    // Check if the station is currently open
    let isOpen;
    if (openNow) {
      isOpen = isOpenNow(station.Horario);
    } else {
      isOpen = true;
    }

    // Return true if the station has the selected fuel and is open (if the checkbox is checked)
    return hasFuel && isOpen;
  });

  filteredStations.forEach(station => {
    const listItem = document.createElement('li');
    listItem.textContent = `${station.Rótulo} - ${station.Dirección} - ${station.Municipio} - ${station.Provincia} - ${station.Horario} - ${station.PrecioProducto}€`;
    gasStationsList.appendChild(listItem);
  });
}

// Check if the station is open now
function isOpenNow(schedule) {
  const now = new Date();
  const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const time = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format

  const daysMap = {
    0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S'
  };

  const today = daysMap[day];

  if (schedule.includes('24H')) {
    return true;
  }

  const daySchedules = schedule.split(';').map(s => s.trim());
  for (const daySchedule of daySchedules) {
    const [days, hours] = daySchedule.split(':').map(s => s.trim());
    if (days.includes(today)) {
      const [open, close] = hours.split('-').map(h => parseInt(h.replace(':', ''), 10));
      if (time >= open && time <= close) {
        return true;
      }
    }
  }
  return false;
}

// Update gas stations list when all filters are applied
function updateGasStations() {
  const selectedProvince = provinceSelect.value;
  const selectedMunicipality = municipalitySelect.value;
  const selectedFuelType = fuelTypeSelect.value;

  if (selectedProvince && selectedMunicipality && selectedFuelType) {
    fetch(`${urlAPI}${endPointMunicipalitiesProducts}${selectedMunicipality}/${selectedFuelType}`)
      .then(response => response.json())
      .then(data => {
        displayGasStations(data.ListaEESSPrecio);
      })
      .catch(error => console.error('Error fetching gas stations:', error));
  }
}

// Event listeners for updating gas stations
provinceSelect.addEventListener('change', updateGasStations);
municipalitySelect.addEventListener('change', updateGasStations);
fuelTypeSelect.addEventListener('change', updateGasStations);
openNowCheckbox.addEventListener('change', updateGasStations);
