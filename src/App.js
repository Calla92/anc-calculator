import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "./App.css";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function calculateAnc(weight, distance_travelled) {
  const wf = Math.sqrt(weight / 50);
  const df = distance_travelled / 100;
  const rf = wf * df;

  if (rf < 1) {
    return 60;
  } else if (rf < 2) {
    return 90;
  } else if (rf < 4) {
    return 140;
  } else if (rf < 8) {
    return 200;
  } else if (rf < 12) {
    return 235;
  } else if (rf < 15) {
    return 280;
  } else if (rf < 20) {
    return 320;
  } else if (rf < 25) {
    return 365;
  } else {
    return 400;
  }
}

function App() {
  const [manufacturers, setManufacturers] = useState([]);
  const [manufacturer, setManufacturer] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [otherAircraft, setOtherAircraft] = useState(""); // Added state for manually entered aircraft
  const [waypoints, setWaypoints] = useState([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState("");
  const [routePoints, setRoutePoints] = useState([]);
  const [weight, setWeight] = useState(0);
  const [result, setResult] = useState("");
  const [aircraftOptions, setAircraftOptions] = useState([]);
  const [filteredAircraftOptions, setFilteredAircraftOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const responseAircraft = await fetch("/aircraft-data.csv");
      const textAircraft = await responseAircraft.text();
      Papa.parse(textAircraft, {
        header: true,
        complete: (result) => {
          const uniqueManufacturers = Array.from(
            new Set(result.data.map((row) => row.manufacturer))
          );
          setManufacturers(uniqueManufacturers);
          setAircraftOptions(result.data);
        },
      });

      const responseWaypoints = await fetch("/waypoints.csv");
      const textWaypoints = await responseWaypoints.text();
      Papa.parse(textWaypoints, {
        header: true,
        complete: (result) => {
          setWaypoints(
            result.data.map((row) => ({
              name: row.name,
              latitude: parseFloat(row.latitude),
              longitude: parseFloat(row.longitude),
            }))
          );
        },
      });
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Update aircraft options whenever the manufacturer changes
    updateAircraftOptions();
  }, [manufacturer, aircraftOptions]);

  const updateAircraftOptions = () => {
    const filteredAircraftOptions = aircraftOptions.filter(
      (row) => row.manufacturer === manufacturer
    );
    setFilteredAircraftOptions(filteredAircraftOptions);
  };

  const addRoutePoint = () => {
    if (selectedWaypoint.trim() !== "") {
      setRoutePoints([...routePoints, selectedWaypoint]);
      setSelectedWaypoint("");
    }
  };

  const removeRoutePoint = (index) => {
    const updatedRoutePoints = [...routePoints];
    updatedRoutePoints.splice(index, 1);
    setRoutePoints(updatedRoutePoints);
  };

  const calculateTotalDistance = () => {
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const startPoint = waypoints.find(
        (point) => point.name === routePoints[i]
      );
      const endPoint = waypoints.find(
        (point) => point.name === routePoints[i + 1]
      );
      if (startPoint && endPoint) {
        totalDistance += calculateDistance(
          startPoint.latitude,
          startPoint.longitude,
          endPoint.latitude,
          endPoint.longitude
        );
      }
    }
    return totalDistance;
  };

  const calculateCharges = () => {
    const totalDistance = calculateTotalDistance();
    const charges = calculateAnc(weight, totalDistance);
    setResult(`Air Navigation Charges: $${charges.toFixed(2)}`);
  };

  const showDetails = () => {
    alert(
      `Weight: ${weight} Tonnes\nTotal Distance: ${calculateTotalDistance().toFixed(
        2
      )} km`
    );
  };

  const clearForm = () => {
    setRoutePoints([]);
    setSelectedWaypoint("");
    setManufacturer("");
    setAircraft("");
    setOtherAircraft(""); // Clear manually entered aircraft
    setWeight(0);
    setResult("Charges will be displayed here.");
  };

  return (
    <div className="container">
      <h1>Air Navigation Charges Calculator</h1>

      <div className="input-section">
        <label htmlFor="manufacturer">Select Manufacturer:</label>
        <select
          id="manufacturer"
          value={manufacturer}
          onChange={(e) => {
            setManufacturer(e.target.value);
            setAircraft(""); // Clear aircraft selection when manufacturer changes
            setOtherAircraft(""); // Clear manually entered aircraft when manufacturer changes
          }}
        >
          <option value="">Select</option>
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer} value={manufacturer}>
              {manufacturer}
            </option>
          ))}
        </select>

        <label htmlFor="aircraft">Select Aircraft:</label>
        <select
          id="aircraft"
          value={aircraft}
          onChange={(e) => {
            setAircraft(e.target.value);
            setOtherAircraft(""); // Clear manually entered aircraft when aircraft changes
            const selectedAircraft = filteredAircraftOptions.find(
              (option) => option.model === e.target.value
            );
            if (selectedAircraft) {
              setWeight(selectedAircraft.weight);
            } else {
              setWeight(0);
            }
          }}
        >
          <option value="">Select</option>
          {filteredAircraftOptions.map((option) => (
            <option key={option.model} value={option.model}>
              {option.model}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>

        {/* Input field for manually entering aircraft */}
        {aircraft === "Other" && (
          <input
            type="text"
            placeholder="Enter Aircraft Model"
            value={otherAircraft}
            onChange={(e) => setOtherAircraft(e.target.value)}
          />
        )}

        <label htmlFor="waypoint">Select Waypoint:</label>
        <select
          id="waypoint"
          value={selectedWaypoint}
          onChange={(e) => setSelectedWaypoint(e.target.value)}
        >
          <option value="">Select</option>
          {waypoints &&
            waypoints.map((waypoint) => (
              <option key={waypoint.name} value={waypoint.name}>
                {waypoint.name} - ({waypoint.latitude}, {waypoint.longitude})
              </option>
            ))}
        </select>

        <button onClick={addRoutePoint}>Add Waypoint to Route</button>

        <button onClick={calculateCharges}>Calculate</button>
      </div>

      <div className="results-section">
        <h2>Route Points</h2>
        <ul>
          {routePoints.map((point, index) => (
            <li key={index}>
              {point}
              <button onClick={() => removeRoutePoint(index)}>Remove</button>
            </li>
          ))}
        </ul>

        <h2>Results</h2>
        <p>{result}</p>
        <button onClick={showDetails}>Details</button>
      </div>

      <button onClick={clearForm}>Clear</button>
    </div>
  );
}

export default App;
