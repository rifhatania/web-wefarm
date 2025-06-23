"use client";

import { useState, useEffect } from 'react';
import { Bookmark, X, ChevronRight } from 'react-feather';
import { db, auth } from '../../../lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, getDoc, collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

export default function PlantGuideModal({ plantName, onClose }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [plantingLoading, setPlantingLoading] = useState(false);
  const [experiences, setExperiences] = useState([]);

  // Function untuk handle bookmark
  const handleBookmark = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert('Anda harus login terlebih dahulu untuk menyimpan bookmark');
      return;
    }

    setBookmarkLoading(true);
    
    try {
      const bookmarkId = `${user.uid}_${plantName}`;
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);

      if (isBookmarked) {
        // Hapus bookmark
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        console.log('Bookmark removed successfully');
      } else {
        // Tambah bookmark
        await setDoc(bookmarkRef, {
          userId: user.uid,
          plantName: plantName,
          plantImage: plantData?.imageUrl || '/default-plant.jpg',
          plantDescription: plantData?.description || '',
          bookmarkedAt: serverTimestamp(),
          userEmail: user.email || '',
          userName: user.displayName || 'Anonymous'
        });
        setIsBookmarked(true);
        console.log('Bookmark added successfully');
      }
    } catch (error) {
      console.error("Error handling bookmark: ", error);
      alert('Gagal menyimpan bookmark. Silakan coba lagi.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Function untuk check apakah sudah di-bookmark
  const checkBookmarkStatus = async () => {
    const user = auth.currentUser;
    
    if (!user) return;

    try {
      const bookmarkId = `${user.uid}_${plantName}`;
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      const bookmarkSnap = await getDoc(bookmarkRef);
      
      setIsBookmarked(bookmarkSnap.exists());
    } catch (error) {
      console.error("Error checking bookmark status: ", error);
    }
  };

  const handlePlanting = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    setPlantingLoading(true);

    try {
      // Generate unique ID dengan timestamp untuk membedakan setiap penanaman
      const timestamp = Date.now();
      const plantingId = `${user.uid}_${plantName}_${timestamp}`;
      
      // Menggunakan addDoc untuk auto-generate ID atau setDoc dengan custom ID
      const plantData_new = {
        id: plantingId, // ID unik untuk setiap penanaman
        userId: user.uid,
        plantName: plantName,
        plantImage: plantData.imageUrl || '/default-plant.jpg',
        startDate: serverTimestamp(),
        estimatedHarvest: plantData.growthDuration || 3,
        targets: plantData.targets || [],
        dailies: plantData.dailies || [],
        progress: 0,
        status: 'active',
        overallStatus: null, // null berarti sedang aktif
        targetStatus: {},
        dailiesStatus: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Simpan dengan ID custom
      await setDoc(doc(db, 'userPlants', plantingId), plantData_new);

      alert(`Tanaman ${plantName} berhasil ditambahkan ke tracker!`);
      onClose();
    } catch (error) {
      console.error("Error adding plant to tracker: ", error);
      alert('Gagal menambahkan tanaman ke tracker');
    } finally {
      setPlantingLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'plants', plantName), (doc) => {
      if (doc.exists()) {
        setPlantData(doc.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plant data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [plantName]);

  // Fetch experiences from userPlants collection
  useEffect(() => {
    // Query sederhana tanpa composite index
    const q = query(
      collection(db, 'userPlants'),
      where('plantName', '==', plantName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const experienceList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter di client side untuk menghindari composite index
        if (data.experience && data.experience.trim() && 
            (data.overallStatus === 'berhasil' || data.overallStatus === 'gagal')) {
          
          // Generate username dengan fallback
          let displayName = 'User';
          
          // Coba ambil dari auth user yang sedang login jika ini plantnya
          const currentUser = auth.currentUser;
          if (currentUser && data.userId === currentUser.uid) {
            displayName = currentUser.displayName || 
                         currentUser.email?.split('@')[0] || 
                         `User${data.userId.slice(-6)}`;
          } else {
            // Untuk user lain, anonymous dengan ID
            displayName = `User${data.userId.slice(-6)}`;
          }
          
          experienceList.push({
            id: doc.id,
            userName: displayName,
            experience: data.experience,
            status: data.overallStatus, // 'berhasil' atau 'gagal'
            createdAt: data.experienceCreatedAt?.toDate() || data.updatedAt?.toDate() || new Date(),
            isCurrentUser: currentUser && data.userId === currentUser.uid
          });
        }
      });
      
      // Sort by creation date (newest first)
      experienceList.sort((a, b) => b.createdAt - a.createdAt);
      setExperiences(experienceList);
    }, (error) => {
      console.error("Error fetching experiences: ", error);
    });

    return () => unsubscribe();
  }, [plantName]);

  // Check bookmark status when component mounts or user changes
  useEffect(() => {
    checkBookmarkStatus();
  }, [plantName]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkBookmarkStatus();
      } else {
        setIsBookmarked(false);
      }
    });

    return () => unsubscribe();
  }, [plantName]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl p-6">
          <p>Loading plant data...</p>
        </div>
      </div>
    );
  }

  if (!plantData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl p-6">
          <p>Plant data not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed text-black inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {bookmarkLoading ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`}
              />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors  text-gray-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 grid md:grid-cols-2 gap-6 p-6">
          {/* Guide Steps */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{plantName}</h2>
            <div className="space-y-3">
              {plantData.guides && plantData.guides.map((step, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            {/* Experiences */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Pengalaman Pengguna ({experiences.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {experiences.length > 0 ? (
                  experiences.map((exp) => (
                    <div key={exp.id} className={`p-3 border rounded-lg ${exp.isCurrentUser ? 'bg-amber-50 border-amber-200' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">
                            {exp.userName}
                            {exp.isCurrentUser && (
                              <span className="text-xs text-amber-600 ml-1">(Anda)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exp.status === 'berhasil' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              ✅ Berhasil
                            </span>
                          )}
                          {exp.status === 'gagal' && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              ❌ Gagal
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {exp.createdAt.toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
<<<<<<< HEAD
                      <div className="text-gray-600 text-sm italic">"{exp.experience}"</div>
=======
                      <div className="text-gray-600 text-sm italic">`{exp.experience}`</div>
>>>>>>> fixingError10
                    </div>
                  ))
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50 text-center">
                    <div className="text-gray-500 mb-2">Belum ada pengalaman yang dibagikan</div>
                    <div className="text-sm text-gray-400">
                      Jadilah yang pertama menanam {plantName} dan bagikan pengalamanmu!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Rekomendasi Produk:</h3>
              <ul className="space-y-2">
                {plantData.products && plantData.products.map((product, i) => (
                  <li key={i}>
                    <Link
                      href={`https://shopee.co.id/search?keyword=${encodeURIComponent(product)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-gray-700">{product}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plantData.imageUrl && (
                  <Image
                    src={plantData.imageUrl}
                    alt={`${plantName} guide`}
                    width={400}
                    height={300}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2  text-gray-400 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePlanting}
            disabled={plantingLoading}
            className='px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {plantingLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Mulai Menanam</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}