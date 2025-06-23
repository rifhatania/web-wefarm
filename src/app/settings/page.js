'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase'; // sesuaikan dengan path Anda
import { ArrowLeft } from 'react-feather';

export default function SettingsPage() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: 'Add Address',
  });
  const [tempUserData, setTempUserData] = useState({ ...user });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
              name: userData.username || authUser.displayName || '',
              email: userData.email || authUser.email,
              phone: userData.phone || '',
              address: userData.address || 'Add Address',
            });
          } else {
            // If user document doesn't exist, create with basic info
            setUser({
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

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password should be at least 6 characters long');
      return;
    }

    if (!currentUser) {
      alert('No user is currently logged in');
      return;
    }

    setPasswordLoading(true);

    try {
      // Create credential with current password for reauthentication
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );

      console.log('Attempting to reauthenticate...');
      // Reauthenticate user with current password
      await reauthenticateWithCredential(currentUser, credential);
      console.log('Reauthentication successful');

      console.log('Updating password...');
      // Update password in Firebase Authentication
      await updatePassword(currentUser, passwordData.newPassword);
      console.log('Password updated successfully in Firebase Auth');

      // Optional: Remove password field from Firestore if it exists
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          password: null, // Remove password field from Firestore
          updatedAt: new Date(),
        });
        console.log('Removed password from Firestore document');
      } catch (firestoreError) {
        console.log('Note: Could not update Firestore document, but Auth password was changed');
      }

      // Reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      alert('Password changed successfully! Please use your new password for future logins.');

    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert('Current password is incorrect. Please check and try again.');
      } else if (error.code === 'auth/weak-password') {
        alert('New password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/requires-recent-login') {
        alert('For security reasons, please log out and log back in before changing your password');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many failed attempts. Please try again later.');
      } else {
        alert('Error changing password: ' + error.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = () => {
    setTempUserData({ ...user });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setTempUserData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    try {
      // Update user data in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        username: tempUserData.name,
        email: tempUserData.email,
        phone: tempUserData.phone,
        address: tempUserData.address,
        updatedAt: new Date(),
      });

      // Update local state
      setUser(tempUserData);
      setShowEditModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + error.message);
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
      {/* Header */}
      <header className="bg-[#E5B961] flex justify-between items-center p-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-3 p-1 hover:bg-amber-400 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img 
            src="/logo wefarm.png" 
            alt="WeFarm Logo" 
            className="h-20 mr-2"
          />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 bg-white min-h-screen text-black">
        {/* User Info Section */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">User Information</h2>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-[#E5B961] text-white rounded-md hover:bg-amber-500 transition-colors text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Name:</span>
              <span className="text-gray-800">{user.name || 'Not provided'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Email:</span>
              <span className="text-gray-800">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Phone:</span>
              <span className="text-gray-800">{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Address:</span>
              <span className="text-gray-800">{user.address}</span>
            </div>
          </div>
        </div>
        
        {/* Settings Options */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
          
          <div 
            className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => setShowPasswordModal(true)}
          >
            <span className="text-gray-700 font-medium">Change Password</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Back Button */}
        <button 
          className="w-full py-3 bg-[#E5B961] text-white rounded-lg hover:bg-amber-500 transition-colors font-medium shadow-sm"
          onClick={() => router.back()}
        >
          Back to Profile
        </button>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={tempUserData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={tempUserData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={tempUserData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    id="address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={tempUserData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E5B961] text-white rounded-md hover:bg-amber-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleSubmitPassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    disabled={passwordLoading}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E5B961] focus:border-transparent"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={passwordLoading}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E5B961] text-white rounded-md hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}