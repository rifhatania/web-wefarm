
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Menu, X, Edit2, Plus, Upload, Trash2 } from 'react-feather';

// Initial plant data (same as in user code)
const initialPlantData = {
  "Cabai Rawit": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Cabai Rawit.jpg",
    targets: [
      "Hari 1-7: Muncul akar kecil",
      "Hari 8-10: Daun pertama",
      "Hari 11-21: Batang menguat dan daun sejati berjumlah 2-4",
      "Hari 22-30: Tinggi tanaman 10-15 cm",
      "(Pindahkan tanaman ke lahan tanam)",
      "Minggu 1-4: Batang bercabang dan daun tumbuh lebat",
      "Minggu 5-6: Tunas bunga muncul",
      "Minggu 7-10: Bakal buah terbentuk berwarna hijau",
      "Minggu 11-12 Buah matang dan siap dipanen"
    ]
  },
  "Cabai Merah": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Cabai Merah.jpg",
    targets: [
      "Day 1-7: Muncul akar kecil",
      "Day 7-10: Daun pertama",
      "Day 10-30: Batang mengeras dan muncul 2-4 daun sejati"
    ]
  },
  "Cabai Hijau": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Cabai Hijau.jpg",
    targets: [
      "Day 1-7: Muncul akar kecil",
      "Day 7-10: Daun pertama",
      "Day 10-30: Batang mengeras dan muncul 2-4 daun sejati"
    ]
  },
  "Cabai Keriting": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Cabai Keriting.jpg",
    targets: [
      "Day 1-7: Muncul akar kecil",
      "Day 7-10: Daun pertama",
      "Day 10-30: Batang mengeras dan muncul 2-4 daun sejati"
    ]
  },
  "Cabai Gendot": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Cabai Gendot.jpg",
    targets: [
      "Day 1-7: Muncul akar kecil",
      "Day 7-10: Daun pertama",
      "Day 10-30: Batang mengeras dan muncul 2-4 daun sejati"
    ]
  },
  "Tomat Sayur": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Tomat Sayur.jpg",
    targets: [
      "Day 1-5: Benih mulai berkecambah",
      "Day 6-14: Tumbuh daun pertama",
      "Day 15-30: Batang mengeras, siap dipindah"
    ]
  },
  "Tomat Ceri": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Tomat Ceri.jpg",
    targets: [
      "Day 1-5: Benih mulai berkecambah",
      "Day 6-14: Tumbuh daun pertama",
      "Day 15-30: Batang mengeras, siap dipindah"
    ]
  },
  "Tomat Hijau": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Tomat Hijau.jpg",
    targets: [
      "Day 1-5: Benih mulai berkecambah",
      "Day 6-14: Tumbuh daun pertama",
      "Day 15-30: Batang mengeras, siap dipindah"
    ]
  },
  "Terong Putih": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Terong Putih.jpg",
    targets: [
      "Day 1-5: Benih mulai berkecambah",
      "Day 6-14: Tumbuh daun pertama",
      "Day 15-30: Batang mengeras, siap dipindah"
    ]
  },
  "Terong Ungu": {
    start: new Date().toLocaleDateString("id-ID"),
    growthDuration: 3,
    estimated: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("id-ID"),
    image: "/Terong Ungu.jpg",
    targets: [
      "Day 1-5: Benih mulai berkecambah",
      "Day 6-14: Tumbuh daun pertama",
      "Day 15-30: Batang mengeras, siap dipindah"
    ]
  }
};

export default function AdminPlantManagement() {
  const [plantData, setPlantData] = useState(initialPlantData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editPlantIndex, setEditPlantIndex] = useState(null);
  const [deletePlantName, setDeletePlantName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [plantName, setPlantName] = useState('');
  const [growthDuration, setGrowthDuration] = useState(3);
  const [targets, setTargets] = useState(['']);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState('');

  // Filter plants based on search
  const filteredPlants = Object.entries(plantData).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open edit modal with plant data
  const openEditModal = (index) => {
    const plantName = Object.keys(plantData)[index];
    const plant = plantData[plantName];
    
    setEditPlantIndex(index);
    setPlantName(plantName);
    setGrowthDuration(plant.growthDuration);
    setTargets([...plant.targets]);
    setCurrentImage(plant.image);
    setImagePreview(plant.image);
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (name) => {
    setDeletePlantName(name);
    setShowDeleteModal(true);
  };

  // Delete plant
  const deletePlant = () => {
    const newPlantData = {...plantData};
    delete newPlantData[deletePlantName];
    
    setPlantData(newPlantData);
    setShowDeleteModal(false);
    setDeletePlantName('');
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

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save edited plant
  const saveEditedPlant = (e) => {
    e.preventDefault();
    
    const oldName = Object.keys(plantData)[editPlantIndex];
    const updatedPlant = {
      ...plantData[oldName],
      growthDuration: parseInt(growthDuration),
      targets: targets.filter(t => t.trim() !== '')
    };
    
    // Use new image if uploaded, otherwise keep current image
    if (imageFile) {
      updatedPlant.image = URL.createObjectURL(imageFile);
    } else {
      updatedPlant.image = currentImage;
    }
    
    // Remove old entry and add new one (in case name changed)
    const newPlantData = {...plantData};
    delete newPlantData[oldName];
    newPlantData[plantName] = updatedPlant;
    
    setPlantData(newPlantData);
    setShowEditModal(false);
    resetForm();
  };

  // Add new plant
  const addNewPlant = (e) => {
    e.preventDefault();
    
    const today = new Date();
    const estimatedDate = new Date();
    estimatedDate.setMonth(today.getMonth() + parseInt(growthDuration));
    
    const newPlant = {
      start: today.toLocaleDateString("id-ID"),
      growthDuration: parseInt(growthDuration),
      estimated: estimatedDate.toLocaleDateString("id-ID"),
      image: imageFile ? URL.createObjectURL(imageFile) : '',
      targets: targets.filter(t => t.trim() !== '')
    };
    
    setPlantData(prev => ({
      ...prev,
      [plantName]: newPlant
    }));
    
    setShowAddModal(false);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setPlantName('');
    setGrowthDuration(3);
    setTargets(['']);
    setImagePreview('');
    setImageFile(null);
    setCurrentImage('');
  };

  // Initialize add form
  const initAddForm = () => {
    resetForm();
    setShowAddModal(true);
  };

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
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-gray-800 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h2 className="text-2xl font-bold text-[#E1A73B] mb-4">Kelola Data Tanaman</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlants.map(([name, data], index) => (
              <div key={name} className="bg-gray-50 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={data.image}
                    alt={name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <div className="p-4 relative">
                  <h3 className="font-semibold text-gray-800">{name}</h3>
                  <p className="text-sm text-gray-600">Durasi: {data.growthDuration} bulan</p>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button 
                      onClick={() => openEditModal(index)}
                      className="bg-[#E1A73B] text-white rounded-full p-2 hover:bg-amber-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(name)}
                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={initAddForm}
              className="bg-[#E1A73B] text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center mx-auto gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Tanaman
            </button>
          </div>
        </div>
      </main>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl p-4 transform transition-transform duration-300">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-200 p-2 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">Rifha</h3>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-5">Menu</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/admin/dashboard" className="block px-3 py-2 hover:bg-gray-100 rounded-lg">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/plants" className="block px-3 py-2 bg-gray-100 rounded-lg font-medium">
                  Kelola Data Tanaman
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#E1A73B]">Tambah Tanaman Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={addNewPlant}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tanaman</label>
                <label className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer text-center hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-sm">Pilih Gambar</span>
                  </div>
                  <input 
                    type="file" 
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                </label>
                {imagePreview && (
                  <div className="mt-2 relative aspect-video rounded-md overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
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
              
              <button
                type="submit"
                className="w-full py-2 bg-[#E1A73B] text-white rounded-md font-medium hover:bg-amber-600"
              >
                Tambah Tanaman
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plant Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center w-full justify-center bg-black/50 overflow-y-auto">
            <div className="flex justify-center w-full h-screen items-start py-10">
                <div className="bg-white rounded-xl p-6 w-[35%] mx-4">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#E1A73B]">Edit Data Tanaman</h3>
                    <button 
                        onClick={() => setShowEditModal(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    </div>
                    
                    <form onSubmit={saveEditedPlant}>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tanaman</label>
                        <label className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer text-center hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                            <Upload className="w-5 h-5 text-gray-500 mb-1" />
                            <span className="text-sm">Ubah Gambar</span>
                        </div>
                        <input 
                            type="file" 
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        </label>
                        <div className="mt-2 relative aspect-video rounded-md overflow-hidden">
                        <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                        </div>
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
                            <button
                                type="button"
                                onClick={() => removeTarget(index)}
                                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                -
                            </button>
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
                    
                    <button
                        type="submit"
                        className="w-full py-2 bg-[#E1A73B] text-white rounded-md font-medium hover:bg-amber-600"
                    >
                        Simpan Perubahan
                    </button>
                    </form>
                </div>
            </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
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