'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase'; // sesuaikan dengan path Anda
import { User, Camera, Settings, LogOut, X, Upload, Trash2 } from 'react-feather';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState({
    avatar: null,
    name: '',
    email: '',
    phone: '',
    address: 'Add Address',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setCurrentUser(authUser);
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              avatar: userData.avatar || null,
              name: userData.username || authUser.displayName || '',
              email: userData.email || authUser.email,
              phone: userData.phone || '',
              address: userData.address || 'Add Address',
            });
          } else {
            // If user document doesn't exist, create with basic info
            setUser({
              avatar: null,
              name: authUser.displayName || '',
              email: authUser.email,
              phone: '',
              address: 'Add Address',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User not authenticated, redirect to login
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    if (user.avatar) {
      setIsPhotoModalOpen(true);
    } else {
      fileInputRef.current.click();
    }
  };

  const handleChangePhoto = () => {
    setIsPhotoModalOpen(false);
    fileInputRef.current.click();
  };

  const handleDeletePhoto = async () => {
    try {
      setUploadLoading(true);
      
      // Update user data in Firestore to remove avatar
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: '',
        updatedAt: new Date(),
      });

      // Update local state
      setUser(prev => ({ ...prev, avatar: null }));
      setIsPhotoModalOpen(false);
      alert('Profile photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploadLoading(true);

    try {
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

      const imageUrl = data.secure_url || data.url;

      if (imageUrl) {
        return imageUrl;
      } else {
        console.error('No URL in response:', data);
        throw new Error('Upload successful but no image URL returned');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
      return null;
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedImage) return;

    try {
      const uploadedImageUrl = await uploadImage();
      
      if (uploadedImageUrl) {
        // Update user data in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          avatar: uploadedImageUrl,
          updatedAt: new Date(),
        });

        // Update local state
        setUser(prev => ({ ...prev, avatar: uploadedImageUrl }));
        setSelectedImage(null);
        setImagePreview(null);
        alert('Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Error updating photo: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out: ' + error.message);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Profile - WeFarm</title>
        <meta name="description" content="WeFarm user profile" />
      </Head>

      {/* Header */}
      <header className="bg-[#E5B961] flex justify-between items-center p-4">
        <Link href="/home" className="flex items-center">
          <img
            src="/logo wefarm.png"
            alt="WeFarm Logo"
            className="h-20 mr-2"
          />
          <h1 className="text-xl font-bold">Profile</h1>
        </Link>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex flex-col text-black md:flex-row justify-center items-start gap-8">
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center relative overflow-hidden border-4 border-[#E5B961]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <User className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <button
                className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50"
                onClick={handleCameraClick}
                disabled={uploadLoading}
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Show image preview if image is selected */}
          {imagePreview && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSavePhoto}
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                >
                  {uploadLoading ? 'Uploading...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* User Card - Preview Only */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-72">
            <h3 className="text-xl font-semibold mb-2">{user.name || 'User'}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {user.address}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <button
            className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full md:w-64"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Settings</span>
          </button>
          <button
            className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full md:w-64"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <LogOut className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </main>

      {/* Photo Management Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-80 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Profile Photo</h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleChangePhoto}
                className="flex items-center gap-3 w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Change Photo
              </button>
              <button
                onClick={handleDeletePhoto}
                disabled={uploadLoading}
                className="flex items-center gap-3 w-full p-3 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                {uploadLoading ? 'Deleting...' : 'Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-black z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-80 mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="mb-6 text-gray-600">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}