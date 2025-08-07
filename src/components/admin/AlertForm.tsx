import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Fix leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const initialFormState = {
  id: '',
  title: '',
  message: '',
  severity: 'DANGER',
  type: 'GENERAL',
  isActive: true,
  area: '',
  createdAt: new Date().toISOString(),
  location: {
    latitude: '',
    longitude: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  },
};

const defaultValues = {
  id: '',
  title: '',
  message: '',
  severity: 'DANGER',
  type: 'GENERAL',
  isActive: true,
  area: '',
  latitude: '',
  longitude: '',
};

const validationSchema = Yup.object({
  title: Yup.string().required('Required'),
  message: Yup.string().required('Required'),
  area: Yup.string().required('Required'),
  latitude: Yup.number().required('Required'),
  longitude: Yup.number().required('Required'),
});

// Component to handle map resizing
const MapResizeHandler = () => {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
};

// Component to handle map clicks and extract coordinates
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    },
  });
  return null;
};

const AlertForm = ({ onSubmit, onCancel, initialValues = defaultValues, isEdit = false }) => {
  const mapRef = useRef(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    return () => {
      // Clean up the map when the component unmounts
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Define handleSelectLocation at the component level, accepting setFieldValue as a parameter
  const handleSelectLocation = (setFieldValue: any) => async (location: any) => {
    setSelectedLocation(location);
    setFieldValue('latitude', location.latitude);
    setFieldValue('longitude', location.longitude);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}`
      );
      const data = await response.json();
      const area = data.address?.suburb || data.address?.village || data.address?.town || data.address?.city || data.display_name || '';
      setFieldValue('area', area);
    } catch (error) {
      setFieldValue('area', '');
    }

    // Hide the modal after selection
    setShowMapModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEdit ? 'Edit Alert' : 'Create New Alert'}</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => {
          // Bind setFieldValue to handleSelectLocation
          const handleMapLocation = handleSelectLocation(setFieldValue);

          return (
            <>
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Field name="title" className="border rounded px-2 py-1 w-full" />
                  <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Field as="textarea" name="message" className="border rounded px-2 py-1 w-full" />
                  <ErrorMessage name="message" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <Field as="select" name="severity" className="border rounded px-2 py-1 w-full">
                    <option value="DANGER">DANGER</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </Field>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <Field type="text" name="area" className="border rounded px-2 py-1 w-full" />
                  <ErrorMessage name="area" component="div" className="text-red-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="border rounded px-2 py-1 w-full"
                      value={values.latitude}
                      onChange={(e) => setFieldValue('latitude', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="border rounded px-2 py-1 w-full"
                      value={values.longitude}
                      onChange={(e) => setFieldValue('longitude', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                {/* Map Button to Open Modal */}
                <div>
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    onClick={() => setShowMapModal(true)}
                  >
                    Select Location on Map
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    disabled={isSubmitting}
                  >
                    {isEdit ? 'Update Alert' : 'Create Alert'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                </div>
              </Form>

              {/* Map Modal */}
              {showMapModal && (
                <div
                  role="dialog"
                  aria-modal="true"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                  onClick={() => setShowMapModal(false)}
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
                      aria-label="Close"
                      onClick={() => setShowMapModal(false)}
                    >
                      &times;
                    </button>
                    <h3 className="text-xl font-bold mb-4">Select Location on Map</h3>
                    <div className="h-96 w-full rounded-lg overflow-hidden border">
                      <MapContainer
                        center={[28.6139, 77.2090]}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                      >
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {selectedLocation && (
                          <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
                            <Popup>Selected Location</Popup>
                          </Marker>
                        )}
                        <MapClickHandler onLocationSelect={handleMapLocation} />
                        <ZoomControl position="topright" />
                        <MapResizeHandler />
                      </MapContainer>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        onClick={() => setShowMapModal(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </Formik>
    </div>
  );
};

export default AlertForm;