import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';

const CAR_CATEGORIES = ['SUV', 'Saloon', 'Coupe', 'Hatch', 'Sedan', 'Van', 'Truck', 'Sport', 'Luxury'];
const CONDITIONS = [
  { value: 'brand_new', label: 'Brand New' },
  { value: 'foreign_used', label: 'Foreign Used' },
  { value: 'nigerian_used_a', label: 'Nigerian Used - Grade A' },
  { value: 'nigerian_used_b', label: 'Nigerian Used - Grade B' },
  { value: 'nigerian_used_c', label: 'Nigerian Used - Grade C' },
];
const LOCATIONS = ['Lagos', 'Abuja', 'Rivers', 'Kano', 'Ogun', 'Oyo', 'Delta', 'Edo', 'Enugu', 'Ibadan'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'Semi-Auto'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const COLORS = ['Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Orange', 'Yellow', 'Beige', 'Other'];

export default function AddCar() {
  const navigate = useNavigate();
  const { carId } = useParams();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(carId);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'SUV',
    name: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    color: 'Black',
    condition: 'brand_new',
    price: '',
    location: 'Lagos',
    customDuty: false,
    proofOfOwnership: false,
    vehicleLicense: false,
  });

  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
    dashboard: null,
    interior: null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    front: '',
    back: '',
    left: '',
    right: '',
    dashboard: '',
    interior: '',
  });

  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    left: useRef(null),
    right: useRef(null),
    dashboard: useRef(null),
    interior: useRef(null),
  };

  useEffect(() => {
    const fetchCarData = async () => {
      if (!carId) {
        setInitialLoading(false);
        return;
      }

      try {
        const carDoc = await getDoc(doc(db, 'cars', carId));
        if (carDoc.exists()) {
          const data = carDoc.data();
          setFormData({
            category: data.category || 'SUV',
            name: data.name || '',
            model: data.model || '',
            year: data.year || '',
            vin: data.vin || '',
            mileage: data.mileage || '',
            transmission: data.transmission || 'Automatic',
            fuelType: data.fuelType || 'Petrol',
            color: data.color || 'Black',
            condition: data.condition || 'brand_new',
            price: data.price || '',
            location: data.location || 'Lagos',
            customDuty: data.papers?.customDuty || false,
            proofOfOwnership: data.papers?.proofOfOwnership || false,
            vehicleLicense: data.papers?.vehicleLicense || false,
          });
          setImagePreviews({
            front: data.images?.front || '',
            back: data.images?.back || '',
            left: data.images?.left || '',
            right: data.images?.right || '',
            dashboard: data.images?.dashboard || '',
            interior: data.images?.interior || '',
          });
        }
      } catch (err) {
        console.error('Error fetching car data:', err);
        setError('Failed to load car data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCarData();
  }, [carId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setImages(prev => ({ ...prev, [fieldName]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (fieldName) => {
    fileInputRefs[fieldName].current?.click();
  };

  const uploadImage = async (file, path) => {
    if (!file) return '';
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Car name is required');
      return;
    }
    if (!formData.model.trim()) {
      setError('Model is required');
      return;
    }
    if (!formData.year.trim()) {
      setError('Year is required');
      return;
    }
    if (!formData.price.trim()) {
      setError('Price is required');
      return;
    }

    setLoading(true);

    try {
      setUploading(true);
      
      const imageUrls = {};
      const timestamp = Date.now();
      
      if (images.front) {
        imageUrls.front = await uploadImage(images.front, `car_images/${currentUser.uid}/${timestamp}_front.jpg`);
      }
      if (images.back) {
        imageUrls.back = await uploadImage(images.back, `car_images/${currentUser.uid}/${timestamp}_back.jpg`);
      }
      if (images.left) {
        imageUrls.left = await uploadImage(images.left, `car_images/${currentUser.uid}/${timestamp}_left.jpg`);
      }
      if (images.right) {
        imageUrls.right = await uploadImage(images.right, `car_images/${currentUser.uid}/${timestamp}_right.jpg`);
      }
      if (images.dashboard) {
        imageUrls.dashboard = await uploadImage(images.dashboard, `car_images/${currentUser.uid}/${timestamp}_dashboard.jpg`);
      }
      if (images.interior) {
        imageUrls.interior = await uploadImage(images.interior, `car_images/${currentUser.uid}/${timestamp}_interior.jpg`);
      }

      setUploading(false);

      if (isEditMode && carId) {
        const existingCar = await getDoc(doc(db, 'cars', carId));
        if (existingCar.exists()) {
          const existingData = existingCar.data();
          Object.keys(imageUrls).forEach(key => {
            if (!imageUrls[key] && existingData.images?.[key]) {
              imageUrls[key] = existingData.images[key];
            }
          });
        }
      }

      const carData = {
        ...formData,
        price: Number(formData.price),
        year: Number(formData.year),
        images: imageUrls,
        papers: {
          customDuty: formData.customDuty,
          proofOfOwnership: formData.proofOfOwnership,
          vehicleLicense: formData.vehicleLicense,
        },
        dealerId: currentUser.uid,
        status: 'active',
        createdAt: isEditMode ? undefined : new Date(),
        updatedAt: new Date(),
      };

      if (isEditMode) {
        delete carData.createdAt;
      }

      if (isEditMode) {
        await updateDoc(doc(db, 'cars', carId), carData);
      } else {
        await setDoc(doc(db, 'cars', timestamp.toString()), carData);
      }

      navigate('/dealer-listings');
    } catch (err) {
      console.error('Error saving car:', err);
      setError('Failed to save car. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
      <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 p-4 pb-2 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleClose}
          className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">close</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Car' : 'Add New Car'}
        </h1>
        <button 
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0 disabled:opacity-50"
        >
          {loading || uploading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <main className="flex-grow px-4 pt-4 pb-28">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {uploading && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400">Uploading images... Please wait.</p>
          </div>
        )}

        <section className="mb-6">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white mb-3">
            Basic Information
          </h2>
          
          <div className="flex py-3 overflow-x-auto">
            <div className="flex h-10 w-full items-center justify-between rounded-lg bg-gray-200 dark:bg-[#282e39] p-1 gap-1">
              {CAR_CATEGORIES.map((category) => (
                <label 
                  key={category}
                  className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-md px-2 text-gray-500 dark:text-[#9ca6ba] has-[:checked]:bg-white has-[:checked]:text-gray-900 dark:has-[:checked]:bg-[#111318] dark:has-[:checked]:text-white text-sm font-medium leading-normal has-[:checked]:shadow-sm transition-colors ${formData.category === category ? 'bg-white dark:bg-[#111318] text-gray-900 dark:text-white shadow-sm' : ''}`}
                >
                  <span className="truncate">{category}</span>
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={formData.category === category}
                    onChange={handleChange}
                    className="invisible w-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 py-3">
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Car Name</p>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                placeholder="e.g., Toyota Camry"
              />
            </label>
            <div className="flex w-full flex-wrap items-end gap-4">
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Model</p>
                <input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                  placeholder="e.g., XLE"
                />
              </label>
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Year</p>
                <input
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                  placeholder="e.g., 2021"
                />
              </label>
            </div>
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">VIN</p>
              <input
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                placeholder="Vehicle Identification Number"
              />
            </label>
            <div className="flex w-full flex-wrap items-end gap-4">
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Mileage (km)</p>
                <input
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                  placeholder="e.g., 50000"
                />
              </label>
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Transmission</p>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="form-select flex h-14 w-full min-w-0 flex-1 resize-none appearance-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:focus:border-primary"
                >
                  {TRANSMISSIONS.map((trans) => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex w-full flex-wrap items-end gap-4">
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Fuel Type</p>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="form-select flex h-14 w-full min-w-0 flex-1 resize-none appearance-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:focus:border-primary"
                >
                  {FUEL_TYPES.map((fuel) => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-40 flex-1 flex-col">
                <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Color</p>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="form-select flex h-14 w-full min-w-0 flex-1 resize-none appearance-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:focus:border-primary"
                >
                  {COLORS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white mb-3">Photos</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'front', label: 'Front' },
              { key: 'back', label: 'Back' },
              { key: 'left', label: 'Left Side' },
              { key: 'right', label: 'Right Side' },
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'interior', label: 'Interior' },
            ].map(({ key, label }) => (
              <div key={key}>
                <input
                  ref={fileInputRefs[key]}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, key)}
                  className="hidden"
                />
                <div
                  onClick={() => handleImageClick(key)}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-[#3b4354] cursor-pointer hover:border-primary dark:hover:border-primary transition-colors overflow-hidden"
                >
                  {imagePreviews[key] ? (
                    <img 
                      src={imagePreviews[key]} 
                      alt={label} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-gray-400 dark:text-[#9ca6ba]">add_a_photo</span>
                      <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca6ba]">{label}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white mb-3">Condition &amp; Documents</h2>
          <div className="flex flex-col gap-4 py-3">
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Condition</p>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="form-select flex h-14 w-full min-w-0 flex-1 resize-none appearance-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:focus:border-primary"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </label>
            <div>
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Available Papers</p>
              <div className="space-y-3 rounded-lg border border-gray-300 bg-white p-4 dark:border-[#3b4354] dark:bg-[#1b1f27]">
                <label className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">Custom-Duty</span>
                  <input
                    name="customDuty"
                    type="checkbox"
                    checked={formData.customDuty}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 rounded border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary"
                  />
                </label>
                <hr className="border-gray-200 dark:border-gray-700"/>
                <label className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">Proof of Ownership</span>
                  <input
                    name="proofOfOwnership"
                    type="checkbox"
                    checked={formData.proofOfOwnership}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 rounded border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary"
                  />
                </label>
                <hr className="border-gray-200 dark:border-gray-700"/>
                <label className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">Vehicle License</span>
                  <input
                    name="vehicleLicense"
                    type="checkbox"
                    checked={formData.vehicleLicense}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 rounded border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-gray-900 dark:text-white mb-3">Pricing &amp; Location</h2>
          <div className="flex flex-col gap-4 py-3">
            <label className="relative flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Price</p>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 dark:text-[#9ca6ba]">₦</span>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] pl-8 text-base font-normal leading-normal text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:placeholder:text-[#9ca6ba] dark:focus:border-primary"
                  placeholder="0.00"
                />
              </div>
            </label>
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900 dark:text-white">Location (State)</p>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-select flex h-14 w-full min-w-0 flex-1 resize-none appearance-none overflow-hidden rounded-lg border border-gray-300 bg-white p-[15px] text-base font-normal leading-normal text-gray-900 focus:border-primary focus:outline-0 focus:ring-0 dark:border-[#3b4354] dark:bg-[#1b1f27] dark:text-white dark:focus:border-primary"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background-light/80 p-4 backdrop-blur-sm dark:bg-background-dark/80">
        <button 
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {loading || uploading ? 'Uploading...' : (isEditMode ? 'Update Car' : 'Upload Car')}
        </button>
      </div>
    </div>
  );
}
