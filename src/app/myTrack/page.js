"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Edit3, MessageSquare } from 'lucide-react';

export default function MyTrackPage() {
  const [trackedPlants, setTrackedPlants] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active');
  const [editingExperience, setEditingExperience] = useState(null);
  const [experienceInputs, setExperienceInputs] = useState({});

  const filterOptions = [
    { key: 'active', label: 'Active', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { key: 'berhasil', label: 'Berhasil', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
    { key: 'gagal', label: 'Gagal', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' },
    { key: 'batal', label: 'Batal', color: 'bg-gray-500', textColor: 'text-gray-600', bgColor: 'bg-gray-50' }
  ];

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch plants when user changes
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'userPlants'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plants = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        plants.push({
          id: doc.id, // ID unik dari Firestore
          customId: data.id, // ID custom yang kita buat
          name: data.plantName,
          image: data.plantImage || '/default-plant.jpg',
          startDate: data.startDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          progress: data.progress || 0,
          overallStatus: data.overallStatus || null,
          estimatedHarvest: data.estimatedHarvest || 3,
          experience: data.experience || null,
          experienceCreatedAt: data.experienceCreatedAt?.toDate() || null,
          plantingNumber: null // Will be set below
        });
      });

      // Sort by creation date (client side) - terbaru dulu
      plants.sort((a, b) => b.createdAt - a.createdAt);

      // Group by plant name dan beri nomor urutan penanaman
      const plantGroups = {};
      plants.forEach((plant) => {
        if (!plantGroups[plant.name]) {
          plantGroups[plant.name] = [];
        }
        plantGroups[plant.name].push(plant);
      });

      // Sort each group by creation date and assign planting numbers
      Object.keys(plantGroups).forEach((plantName) => {
        plantGroups[plantName].sort((a, b) => a.createdAt - b.createdAt);
        plantGroups[plantName].forEach((plant, index) => {
          plant.plantingNumber = index + 1;
        });
      });

      setTrackedPlants(plants);
      
      // Initialize experience inputs dengan data yang sudah ada
      const inputs = {};
      plants.forEach(plant => {
        if ((plant.overallStatus === 'berhasil' || plant.overallStatus === 'gagal') && plant.experience) {
          inputs[plant.id] = plant.experience;
        }
      });
      setExperienceInputs(inputs);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle experience save
  const handleExperienceSave = async (plantId) => {
    const experienceText = experienceInputs[plantId];
    if (!experienceText || !experienceText.trim()) return;

    try {
      await updateDoc(doc(db, 'userPlants', plantId), {
        experience: experienceText.trim(),
        experienceCreatedAt: new Date(),
        updatedAt: new Date()
      });
      
      setEditingExperience(null);
      alert('Pengalaman berhasil disimpan!');
    } catch (error) {
      console.error("Error saving experience:", error);
      alert('Gagal menyimpan pengalaman. Silakan coba lagi.');
    }
  };

  // Handle experience input change
  const handleExperienceChange = (plantId, value) => {
    setExperienceInputs(prev => ({
      ...prev,
      [plantId]: value
    }));
  };

  // Filter plants based on active filter
  useEffect(() => {
    if (activeFilter === 'active') {
      setFilteredPlants(trackedPlants.filter(plant => !plant.overallStatus));
    } else {
      setFilteredPlants(trackedPlants.filter(plant => plant.overallStatus === activeFilter));
    }
  }, [trackedPlants, activeFilter]);

  // Get count for each filter
  const getFilterCount = (filterKey) => {
    if (filterKey === 'active') {
      return trackedPlants.filter(plant => !plant.overallStatus).length;
    }
    return trackedPlants.filter(plant => plant.overallStatus === filterKey).length;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'berhasil':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Berhasil</span>;
      case 'gagal':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">❌ Gagal</span>;
      case 'batal':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">⏸️ Dibatalkan</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">🌱 Berlangsung</span>;
    }
  };

  // Format plant display name with planting number
  const getPlantDisplayName = (plant) => {
    const totalPlantings = trackedPlants.filter(p => p.name === plant.name).length;
    if (totalPlantings > 1) {
      return `${plant.name} #${plant.plantingNumber}`;
    }
    return plant.name;
  };

  // Get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hari ini';
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} minggu lalu`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} bulan lalu`;
    return `${Math.floor(diffInDays / 365)} tahun lalu`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-400 to-amber-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-400 to-amber-500">
        <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-800 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">My Track</h1>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Please Login</h2>
            <p>You need to login to view your tracked plants.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-gray-800 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">My Track</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map((option) => {
              const count = getFilterCount(option.key);
              const isActive = activeFilter === option.key;

              return (
                <button
                  key={option.key}
                  onClick={() => setActiveFilter(option.key)}
                  className={`flex items-center px-4 py-2 rounded-full font-medium transition-all duration-200 ${isActive
                      ? `${option.color} text-white shadow-md`
                      : `${option.bgColor} ${option.textColor} hover:shadow-sm border border-gray-200`
                    }`}
                >
                  <span>{option.label}</span>
                  {count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${isActive
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-white text-gray-600'
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-gray-600">
            {filteredPlants.length} tanaman dalam kategori {filterOptions.find(f => f.key === activeFilter)?.label.toLowerCase()}
          </p>
        </div>

        {filteredPlants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {activeFilter === 'active'
                ? 'Belum Ada Tanaman Aktif'
                : `Belum Ada Tanaman ${filterOptions.find(f => f.key === activeFilter)?.label}`
              }
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {activeFilter === 'active'
                ? 'Anda belum memiliki tanaman yang sedang ditanam. Mulai mencari tanaman untuk ditanam!'
                : `Belum ada tanaman dengan status ${filterOptions.find(f => f.key === activeFilter)?.label.toLowerCase()}.`
              }
            </p>
            {activeFilter === 'active' && (
              <Link
                href="/home"
                className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari Tanaman
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlants.map((plant) => (
              <div key={plant.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="aspect-square relative">
                  <Image
                    src={plant.image}
                    alt={plant.name}
                    fill
                    className="object-cover"
                  />
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(plant.overallStatus)}
                  </div>
                  {/* Planting Number Badge */}
                  {plant.plantingNumber > 1 && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                        #{plant.plantingNumber}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{getPlantDisplayName(plant)}</h3>
                  
                  {/* Date Information */}
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Mulai: {plant.startDate.toLocaleDateString('id-ID')}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{getRelativeTime(plant.startDate)}</span>
                  </div>

                  {/* Plant ID (for debugging/reference) */}
                  <div className="text-xs text-gray-400 mb-3 font-mono">
                    ID: {plant.customId?.split('_').pop() || 'legacy'}
                  </div>

                  {/* Progress Bar - Only show for active plants */}
                  {!plant.overallStatus && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-amber-600">{plant.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${plant.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Status-specific information */}
                  {plant.overallStatus && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600">
                        {plant.overallStatus === 'berhasil' && `Berhasil dipanen!`}
                        {plant.overallStatus === 'gagal' && `Progress: ${plant.progress}%`}
                        {plant.overallStatus === 'batal' && `Dibatalkan di ${plant.progress}%`}
                      </div>
                    </div>
                  )}

                  {/* Experience Section for berhasil/gagal plants */}
                  {(plant.overallStatus === 'berhasil' || plant.overallStatus === 'gagal') && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Pengalaman
                        </span>
                        {plant.experience && editingExperience !== plant.id && (
                          <button
                            onClick={() => {
                              setEditingExperience(plant.id);
                              if (!experienceInputs[plant.id]) {
                                setExperienceInputs(prev => ({
                                  ...prev,
                                  [plant.id]: plant.experience || ''
                                }));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit pengalaman"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {editingExperience === plant.id ? (
                        <div className="text-black space-y-2">
                          <textarea
                            value={experienceInputs[plant.id] || ''}
                            onChange={(e) => handleExperienceChange(plant.id, e.target.value)}
                            placeholder={`Bagikan pengalaman menanam ${plant.name}...`}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                            rows={3}
                            maxLength={300}
                          />
                          <div className="text-right text-xs text-gray-500 mb-2">
                            {(experienceInputs[plant.id] || '').length}/300 karakter
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExperienceSave(plant.id)}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                              disabled={!experienceInputs[plant.id]?.trim()}
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => {
                                setEditingExperience(null);
                                setExperienceInputs(prev => ({
                                  ...prev,
                                  [plant.id]: plant.experience || ''
                                }));
                              }}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {plant.experience ? (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700 leading-relaxed">`{plant.experience}`</p>
                              {plant.experienceCreatedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {plant.experienceCreatedAt.toLocaleDateString('id-ID')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingExperience(plant.id);
                                setExperienceInputs(prev => ({
                                  ...prev,
                                  [plant.id]: ''
                                }));
                              }}
                              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                            >
                              + Tambahkan pengalaman menanam
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/track?id=${encodeURIComponent(plant.id)}`}
                    className={`block w-full text-center px-4 py-2.5 rounded-xl transition-colors font-medium border ${plant.overallStatus === 'berhasil'
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                        : plant.overallStatus === 'gagal'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                          : plant.overallStatus === 'batal'
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                      }`}
                  >
                    {plant.overallStatus === 'berhasil' && '🎉 Lihat Hasil'}
                    {plant.overallStatus === 'gagal' && '📖 Lihat Detail'}
                    {plant.overallStatus === 'batal' && 'Lihat Detail'}
                    {!plant.overallStatus && 'Lihat Detail'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}