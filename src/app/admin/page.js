"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Menu, X, Edit2, Plus, Trash2, Upload } from 'react-feather';
import { db } from '../../../lib/firebase';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

function AdminPlantManagement() {
  // State declarations
  const [plantData, setPlantData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editPlantId, setEditPlantId] = useState(null);
  const [deletePlantId, setDeletePlantId] = useState('');
  const [deletePlantName, setDeletePlantName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [guides, setGuides] = useState(['']);
  const [dailies, setDailies] = useState(['']);
  const [products, setProducts] = useState(['']);

  // Form states
  const [plantName, setPlantName] = useState('');
  const [growthDuration, setGrowthDuration] = useState(3);
  const [targets, setTargets] = useState(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch plants from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'plants'), (querySnapshot) => {
      const plants = {};
      querySnapshot.forEach((doc) => {
        plants[doc.id] = { id: doc.id, ...doc.data() };
      });
      setPlantData(plants);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plants: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter plants based on search
  const filteredPlants = useMemo(() =>
    Object.entries(plantData).filter(([id, data]) =>
      data.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [plantData, searchQuery]
  );

  // Reset form fields
  const resetForm = useCallback(() => {
    setPlantName('');
    setGrowthDuration(3);
    setGuides(['']);
    setTargets(['']);
    setDailies(['']);
    setProducts(['']);
    setImageUrl('');
    setSelectedImage(null);
  }, []);
  // Handle add plant button click
  const handleAddPlantClick = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  // Open edit modal with plant data
  const openEditModal = (plantId) => {
    const plant = plantData[plantId];
    setEditPlantId(plantId);
    setPlantName(plant.name);
    setGrowthDuration(plant.growthDuration);
    setGuides(plant.guides || ['']);
    setTargets(plant.targets || ['']);
    setDailies(plant.dailies || ['']);
    setProducts(plant.products || ['']);
    setImageUrl(plant.imageUrl || '');
    setSelectedImage(null);
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (plantId, name) => {
    setDeletePlantId(plantId);
    setDeletePlantName(name);
    setShowDeleteModal(true);
  };

  // Delete plant from Firebase
  const deletePlant = async () => {
    try {
      await deleteDoc(doc(db, 'plants', deletePlantId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting plant: ", error);
      alert("Gagal menghapus tanaman. Silakan coba lagi.");
    }
  };

  // Add target input field
  const addTarget = () => {
    setTargets([...targets, '']);
  };

  // Remove target
  const removeTarget = (index) => {
    const newTargets = [...targets];
    newTargets.splice(index, 1);
    setTargets(newTargets);
  };

  // Handle target change
  const handleTargetChange = (index, value) => {
    const newTargets = [...targets];
    newTargets[index] = value;
    setTargets(newTargets);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Upload image to Cloudinary menggunakan Unsigned Upload yang lebih sederhana
  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploadLoading(true);

    try {
      // Buat URL untuk upload gambar yang lebih sederhana
      const cloudName = 'dxngntoqp';
      const unsignedUploadPreset = 'wefarm-plant'; // Ganti dengan unsigned upload preset Anda

      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('upload_preset', unsignedUploadPreset);

      console.log('Uploading to Cloudinary...');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary response error:', errorText);
        throw new Error(`Upload gagal: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);

      setUploadLoading(false);

      // Using .url instead of .secure_url if there are issues with HTTPS
      const imageUrl = data.secure_url || data.url;

      if (imageUrl) {
        setImageUrl(imageUrl);
        return imageUrl;
      } else {
        console.error('No URL in response:', data);
        throw new Error('Upload successful but no image URL returned');
      }
    } catch (error) {
      setUploadLoading(false);
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
      return null;
    }
  };

  const addGuide = () => {
    setGuides([...guides, '']);
  };

  const removeGuide = (index) => {
    const newGuides = [...guides];
    newGuides.splice(index, 1);
    setGuides(newGuides);
  };

  const handleGuideChange = (index, value) => {
    const newGuides = [...guides];
    newGuides[index] = value;
    setGuides(newGuides);
  };

  // Fungsi untuk menambah/menghapus/mengubah daily
  const addDaily = () => {
    setDailies([...dailies, '']);
  };

  const removeDaily = (index) => {
    const newDailies = [...dailies];
    newDailies.splice(index, 1);
    setDailies(newDailies);
  };

  const handleDailyChange = (index, value) => {
    const newDailies = [...dailies];
    newDailies[index] = value;
    setDailies(newDailies);
  };

  const addProduct = () => {
    setProducts([...products, '']);
  };

  const removeProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const handleProductChange = (index, value) => {
    const newProducts = [...products];
    newProducts[index] = value;
    setProducts(newProducts);
  };

  // Add new plant to Firebase
  const addNewPlant = async (e) => {
    e.preventDefault();

    if (!plantName.trim()) {
      alert('Nama Tanaman harus diisi');
      return;
    }

    if (targets.filter(t => t.trim() !== '').length === 0) {
      alert('Setidaknya satu target harus diisi');
      return;
    }
  
    setIsLoading(true);

    try {
      let uploadedImageUrl = imageUrl;
      if (selectedImage) {
        try {
          uploadedImageUrl = await uploadImage();
          if (!uploadedImageUrl) {
            console.log("Upload image returned null");
            // Tetap lanjutkan tanpa gambar jika upload gagal
            uploadedImageUrl = '';
          }
        } catch (uploadError) {
          console.error("Error during image upload:", uploadError);
          // Tetap lanjutkan tanpa gambar jika upload gagal
          uploadedImageUrl = '';
        }
      }

      console.log("Saving plant with image URL:", uploadedImageUrl);

      const newPlant = {
        name: plantName.trim(),
        growthDuration: parseInt(growthDuration),
        guides: guides.filter(g => g.trim() !== ''),
        targets: targets.filter(t => t.trim() !== ''),
        dailies: dailies.filter(d => d.trim() !== ''),
        products: products.filter(p => p.trim() !== ''),
        imageUrl: uploadedImageUrl || '',
        createdAt: new Date().toISOString()
      };


      // Gunakan setDoc dengan nama dokumen sendiri
      const plantDocRef = doc(db, 'plants', plantName.trim());
      await setDoc(plantDocRef, newPlant);

      setShowAddModal(false);
      resetForm();
      alert('Tanaman berhasil ditambahkan!');
    } catch (error) {
      console.error("Error adding plant:", error);
      alert('Gagal menambahkan tanaman: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing plant in Firebase
  const saveEditedPlant = async (e) => {
    e.preventDefault();

    if (!plantName.trim()) {
      alert('Nama Tanaman harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      // Upload image jika ada
      let uploadedImageUrl = imageUrl;
      if (selectedImage) {
        try {
          uploadedImageUrl = await uploadImage();
          if (!uploadedImageUrl) {
            console.log("Upload image returned null in edit");
            // Jika upload gagal, tetap gunakan URL gambar lama jika ada
            uploadedImageUrl = imageUrl;
          }
        } catch (uploadError) {
          console.error("Error during image upload in edit:", uploadError);
          // Jika upload gagal, tetap gunakan URL gambar lama jika ada
          uploadedImageUrl = imageUrl;
        }
      }

      console.log("Saving edited plant with image URL:", uploadedImageUrl);

      const updatedPlant = {
        name: plantName.trim(),
        growthDuration: parseInt(growthDuration),
        guides: guides.filter(g => g.trim() !== ''),
        targets: targets.filter(t => t.trim() !== ''),
        dailies: dailies.filter(d => d.trim() !== ''),
        products: products.filter(p => p.trim() !== ''), // Tambahkan ini
        imageUrl: uploadedImageUrl || '',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'plants', editPlantId), updatedPlant);

      setShowEditModal(false);
      resetForm();
      alert('Perubahan berhasil disimpan!');
    } catch (error) {
      console.error("Error updating plant:", error);
      alert('Gagal menyimpan perubahan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E1A73B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tanaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo wefarm.png"
            alt="WeFarm Logo"
            width={96}
            height={96}
            className="h-16 w-auto"
            priority
          />
        </Link>

        <div className="relative flex-1 max-w-md mx-4">
          <input
            type="text"
            placeholder="Cari tanaman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 px-4 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-gray-800 hover:text-gray-700">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h2 className="text-2xl font-bold text-[#E1A73B] mb-4">Kelola Data Tanaman</h2>

          {filteredPlants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada tanaman ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPlants.map(([id, data]) => (
                <div key={id} className="bg-gray-50 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                  <div className="aspect-square bg-gray-200 flex items-center justify-center relative overflow-hidden">
                    {data.imageUrl ? (
                      <Image
                        src={data.imageUrl}
                        alt={data.name}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-gray-500">No Image</span>
                    )}
                  </div>
                  <div className="p-4 relative">
                    <h3 className="font-semibold text-gray-800">{data.name}</h3>
                    <p className="text-sm text-gray-600">Durasi: {data.growthDuration} bulan</p>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(id)}
                        className="bg-[#E1A73B] text-white rounded-full p-2 hover:bg-amber-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(id, data.name)}
                        className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={handleAddPlantClick}
              className="bg-[#E1A73B] text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center mx-auto gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Tanaman
            </button>
          </div>
        </div>
      </main>

      {/* Add Plant Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#E1A73B]">Tambah Tanaman Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={addNewPlant} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tanaman</label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Tumbuh (bulan)</label>
                <input
                  type="number"
                  value={growthDuration}
                  onChange={(e) => setGrowthDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tanaman</label>
                <div className="mt-2 flex items-center">
                  <input
                    type="file"
                    id="plantImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="plantImage"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedImage ? 'Ganti Gambar' : 'Unggah Gambar'}
                  </label>
                  {selectedImage && (
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedImage.name.length > 20
                        ? selectedImage.name.substring(0, 20) + '...'
                        : selectedImage.name}
                    </span>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
              </div>


              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Panduan (Guide)</label>
                <div className="space-y-2">
                  {guides.map((guide, index) => (
                    <div key={`guide-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={guide}
                        onChange={(e) => handleGuideChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Panduan ${index + 1}`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeGuide(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addGuide}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Panduan
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Pertumbuhan</label>
                <div className="space-y-2">
                  {targets.map((target, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => handleTargetChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Target ${index + 1}`}
                        required={index === 0}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeTarget(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTarget}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Target
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Harian (Daily)</label>
                <div className="space-y-2">
                  {dailies.map((daily, index) => (
                    <div key={`daily-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={daily}
                        onChange={(e) => handleDailyChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Aktivitas harian ${index + 1}`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDaily(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addDaily}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Aktivitas Harian
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Produk yang Dibutuhkan</label>
                <div className="space-y-2">
                  {products.map((product, index) => (
                    <div key={`product-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={product}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Produk ${index + 1} (contoh: pot tanaman)`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Produk
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || uploadLoading}
                className={`w-full py-2 rounded-md font-medium ${isLoading || uploadLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#E1A73B] text-white hover:bg-amber-600'
                  }`}
              >
                {isLoading ? 'Menambahkan...' : uploadLoading ? 'Mengupload Gambar...' : 'Tambah Tanaman'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plant Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#E1A73B]">Edit Data Tanaman</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={saveEditedPlant} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tanaman</label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Tumbuh (bulan)</label>
                <input
                  type="number"
                  value={growthDuration}
                  onChange={(e) => setGrowthDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tanaman</label>
                <div className="mt-2 flex items-center">
                  <input
                    type="file"
                    id="editPlantImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="editPlantImage"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedImage ? 'Ganti Gambar' : 'Unggah Gambar'}
                  </label>
                  {selectedImage && (
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedImage.name.length > 20
                        ? selectedImage.name.substring(0, 20) + '...'
                        : selectedImage.name}
                    </span>
                  )}
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Panduan (Guide)</label>
                <div className="space-y-2">
                  {guides.map((guide, index) => (
                    <div key={`guide-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={guide}
                        onChange={(e) => handleGuideChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Panduan ${index + 1}`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeGuide(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addGuide}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Panduan
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Pertumbuhan</label>
                <div className="space-y-2">
                  {targets.map((target, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => handleTargetChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        required={index === 0}
                      />
                      {targets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTarget(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTarget}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Target
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Harian (Daily)</label>
                <div className="space-y-2">
                  {dailies.map((daily, index) => (
                    <div key={`daily-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={daily}
                        onChange={(e) => handleDailyChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Aktivitas harian ${index + 1}`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDaily(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addDaily}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Aktivitas Harian
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Produk yang Dibutuhkan</label>
                <div className="space-y-2">
                  {products.map((product, index) => (
                    <div key={`product-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={product}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={`Produk ${index + 1} (contoh: pot tanaman)`}
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="mt-2 px-3 py-1 bg-[#E1A73B] text-white rounded-md text-sm hover:bg-amber-600"
                >
                  + Tambah Produk
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || uploadLoading}
                className={`w-full py-2 rounded-md font-medium ${isLoading || uploadLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#E1A73B] text-white hover:bg-amber-600'
                  }`}
              >
                {isLoading ? 'Menyimpan...' : uploadLoading ? 'Mengupload Gambar...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-500">Hapus Tanaman</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="mb-6 text-gray-700">
              Apakah Anda yakin ingin menghapus tanaman <span className="font-semibold">{deletePlantName}</span>?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={deletePlant}
                className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(AdminPlantManagement);