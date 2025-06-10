"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Bookmark, Trash2, User, Menu, X, Search } from 'react-feather';
import PlantGuideModal from '../components/PlantGuideModal';
import { db, auth } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function BookmarkPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState([]);
    const [filteredBookmarks, setFilteredBookmarks] = useState([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(true);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});

    // Fetch bookmarks dari Firebase
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch bookmarks ketika user berubah
    useEffect(() => {
        if (!user) {
            setBookmarks([]);
            setBookmarksLoading(false);
            return;
        }

        const bookmarksQuery = query(
            collection(db, 'bookmarks'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(bookmarksQuery, (querySnapshot) => {
            const bookmarksData = [];
            querySnapshot.forEach((doc) => {
                bookmarksData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort by bookmarked date (newest first)
            bookmarksData.sort((a, b) => {
                if (a.bookmarkedAt && b.bookmarkedAt) {
                    return b.bookmarkedAt.toDate() - a.bookmarkedAt.toDate();
                }
                return 0;
            });

            setBookmarks(bookmarksData);
            setBookmarksLoading(false);
        }, (error) => {
            console.error("Error fetching bookmarks: ", error);
            setBookmarksLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Filter bookmarks berdasarkan search
    useEffect(() => {
        const filtered = bookmarks.filter(bookmark =>
            bookmark.plantName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredBookmarks(filtered);
    }, [bookmarks, searchQuery]);

    // Handle remove bookmark
    const handleRemoveBookmark = async (bookmarkId, plantName) => {
        if (!confirm(`Hapus ${plantName} dari bookmark?`)) return;

        setDeleteLoading(prev => ({ ...prev, [bookmarkId]: true }));

        try {
            await deleteDoc(doc(db, 'bookmarks', bookmarkId));
            console.log('Bookmark removed successfully');
        } catch (error) {
            console.error("Error removing bookmark: ", error);
            alert('Gagal menghapus bookmark');
        } finally {
            setDeleteLoading(prev => ({ ...prev, [bookmarkId]: false }));
        }
    };

    // Format tanggal
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Loading state
    if (loading || bookmarksLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E1A73B] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat bookmark...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 text-black">
                {/* Header */}
                <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/home" className="text-gray-800 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Bookmark</h1>
                    </div>
                </header>

                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center p-8">
                        <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Login Diperlukan</h2>
                        <p className="text-gray-600 mb-6">Silakan login terlebih dahulu untuk melihat bookmark Anda</p>
                        <Link
                            href="/login"
                            className="px-6 py-3 bg-[#E1A73B] text-white rounded-lg hover:bg-[#d1973a] transition-colors"
                        >
                            Login Sekarang
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-black min-h-screen">
            {/* Header */}
            <header className="flex justify-between items-center bg-[#E5B961] p-4 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/home" className="text-gray-800 hover:text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Bookmark</h1>
                </div>

                <div className="flex items-center gap-4">
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4">
                {filteredBookmarks.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="text-center">
                            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                {searchQuery ? 'Tidak ditemukan' : 'Belum ada bookmark'}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {searchQuery
                                    ? `Tidak ada bookmark yang cocok dengan "${searchQuery}"`
                                    : 'Mulai bookmark tanaman favorit Anda dari halaman utama'
                                }
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/home"
                                    className="px-6 py-3 bg-[#E1A73B] text-white rounded-lg hover:bg-[#d1973a] transition-colors"
                                >
                                    Jelajahi Tanaman
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Bookmark Stats */}
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-gray-600">
                                Total bookmark: <span className="font-semibold text-[#E1A73B]">{bookmarks.length}</span>
                                {searchQuery && (
                                    <span className="ml-2">
                                        (Menampilkan {filteredBookmarks.length} hasil pencarian)
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Bookmark Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredBookmarks.map((bookmark) => (
                                <div
                                    key={bookmark.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="aspect-video relative overflow-hidden">
                                        <Image
                                            src={bookmark.plantImage || '/default-plant.jpg'}
                                            alt={bookmark.plantName}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <button
                                                onClick={() => handleRemoveBookmark(bookmark.id, bookmark.plantName)}
                                                disabled={deleteLoading[bookmark.id]}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                                                title="Hapus bookmark"
                                            >
                                                {deleteLoading[bookmark.id] ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800 text-lg">{bookmark.plantName}</h3>
                                            <Bookmark className="w-5 h-5 text-[#E1A73B] fill-[#E1A73B] flex-shrink-0" />
                                        </div>

                                        {bookmark.plantDescription && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {bookmark.plantDescription}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500">
                                                Disimpan {formatDate(bookmark.bookmarkedAt)}
                                            </p>
                                            <button
                                                onClick={() => setSelectedPlant(bookmark.plantName)}
                                                className="px-4 py-2 bg-[#E1A73B] text-white text-sm rounded-lg hover:bg-[#d1973a] transition-colors"
                                            >
                                                Lihat Guide
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                <Link href="/" className="block px-3 py-2 hover:bg-gray-100 rounded-lg">
                                    Beranda
                                </Link>
                            </li>
                            <li>
                                <Link href="/myTrack" className="block px-3 py-2 hover:bg-gray-100 rounded-lg">
                                    Tracker
                                </Link>
                            </li>
                            <li>
                                <div className="block px-3 py-2 bg-[#E1A73B] text-white rounded-lg">
                                    Bookmark
                                </div>
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