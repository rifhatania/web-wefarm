"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Menu, X } from 'react-feather';
import PlantGuideModal from '../components/PlantGuideModal';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch plants from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'plants'), (querySnapshot) => {
      const plantsData = [];
      querySnapshot.forEach((doc) => {
        plantsData.push({
          id: doc.id,
          name: doc.data().name,
          image: doc.data().imageUrl || '/default-plant.jpg',
          duration: `${doc.data().growthDuration} Bulan`
        });
      });
      setPlants(plantsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plants: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter plants based on search
  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="bg-gray-50 text-black min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
<<<<<<< HEAD
        <Link href="/" className="flex items-center">
=======
        <Link href="/home" className="flex items-center">
>>>>>>> fixingError10
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPlants.map((plant, index) => (
            <div
              key={index}
              onClick={() => setSelectedPlant(plant.name)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={plant.image}
                  alt={plant.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800">{plant.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span>⏳</span> {plant.duration}
                </p>
              </div>
            </div>
          ))}
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
            <h2 className="text-xl font-bold mb-5">Menu</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/myTrack" className="block px-3 py-2 hover:bg-gray-100 rounded-lg">
                  Tracker
                </Link>
              </li>
              <li>
                <Link href="/bookmark" className="block px-3 py-2 hover:bg-gray-100 rounded-lg">
                  Bookmark
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Plant Guide Modal */}
      {selectedPlant && (
        <PlantGuideModal
          plantName={selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}
    </div>
  );
}