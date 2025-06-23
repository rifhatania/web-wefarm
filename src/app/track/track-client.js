// app/track/track-client.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { auth, db } from '../../../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export default function TrackPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [plantId, setPlantId] = useState(null);
  const [plantName, setPlantName] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState({});
  const [dailiesStatus, setDailiesStatus] = useState({});
  const [plantOverallStatus, setPlantOverallStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plantData, setPlantData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(null);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [experienceText, setExperienceText] = useState('');

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Menggunakan ID unik sebagai parameter
    const queryPlantId = searchParams.get('id');
    const queryPlantName = searchParams.get('plant'); // Backup untuk kompatibilitas

    if (!queryPlantId && !queryPlantName) {
      router.push('/myTrack');
      return;
    }

    if (currentUser) {
      let docId = queryPlantId;

      if (!docId && queryPlantName) {
        docId = `${currentUser.uid}_${queryPlantName}`;
      }

      setPlantId(docId);

      const docRef = doc(db, 'userPlants', docId);

      const unsubscribe = onSnapshot(docRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const startDate = data.startDate?.toDate();
          const estimated = new Date(startDate);
          estimated.setMonth(estimated.getMonth() + (data.estimatedHarvest || 3));

          setPlantData({
            ...data,
            start: startDate?.toLocaleDateString("id-ID"),
            estimated: estimated?.toLocaleDateString("id-ID"),
            image: data.plantImage,
            targets: data.targets || [],
            dailies: data.dailies || []
          });

          setPlantName(data.plantName);
          setTargetStatus(data.targetStatus || {});
          setPlantOverallStatus(data.overallStatus || null);

          const allDailyStatuses = data.dailiesStatus || {};
          const todayStatus = allDailyStatuses[todayKey] || {};
          const defaultStatus = {};
          (data.dailies || []).forEach((_, i) => {
            defaultStatus[i] = !!todayStatus[i];
          });
          setDailiesStatus(defaultStatus);

          setIsLoading(false);
        } else {
          router.push('/myTrack');
        }
      });

      return () => unsubscribe();
    }
  }, [searchParams, currentUser, router, todayKey]);

  const handleStatusClick = async (index, status) => {
    if (!currentUser || !plantId) return;

    try {
      const newStatus = { ...targetStatus, [index]: status };
      setTargetStatus(newStatus);

      const completed = plantData.targets.filter((_, i) => newStatus[i] === 'checked').length;
      const progress = (completed / plantData.targets.length) * 100;

      // Check if all targets are completed
      const allCompleted = plantData.targets.every((_, i) => newStatus[i] === 'checked');
      let overallStatus = plantOverallStatus;

      if (allCompleted && !plantOverallStatus) {
        overallStatus = 'berhasil';
        setPlantOverallStatus('berhasil');
      }

      await updateDoc(doc(db, 'userPlants', plantId), {
        targetStatus: newStatus,
        progress: progress,
        overallStatus: overallStatus,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error("Error updating status:", error);
      setTargetStatus(prev => ({ ...prev, [index]: undefined }));
    }
  };

  const handleDailyToggle = async (index) => {
    if (!currentUser || !plantId) return;

    try {
      const newStatus = { ...dailiesStatus, [index]: !dailiesStatus[index] };
      setDailiesStatus(newStatus);

      const docRef = doc(db, 'userPlants', plantId);
      const currentDoc = plantData.dailiesStatus || {};

      await updateDoc(docRef, {
        dailiesStatus: {
          ...currentDoc,
          [todayKey]: newStatus
        },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating daily status:", error);
      setDailiesStatus(prev => ({ ...prev }));
    }
  };

  const handlePlantStatusChange = async (status) => {
    if (!currentUser || !plantId) return;

    try {
      setPlantOverallStatus(status);
      await updateDoc(doc(db, 'userPlants', plantId), {
        overallStatus: status,
        statusUpdatedAt: new Date(),
        updatedAt: new Date()
      });
      setShowStatusModal(false);

      if (status === 'berhasil' || status === 'gagal') {
        setShowExperienceModal(true);
      }
    } catch (error) {
      console.error("Error updating plant status:", error);
      setPlantOverallStatus(plantOverallStatus); // Rollback
    }
  };

  const confirmStatusChange = (status) => {
    setPendingStatus(status);
    setShowStatusModal(true);
  };

  const handleTargetClick = (index) => {
    setSelectedTargetIndex(index);
    setShowTargetModal(true);
  };

  const handleTargetStatusChange = async (status) => {
    if (selectedTargetIndex !== null) {
      await handleStatusClick(selectedTargetIndex, status);
    }
    setShowTargetModal(false);
    setSelectedTargetIndex(null);
  };

  const handleExperienceSubmit = async () => {
    if (!currentUser || !plantId || !experienceText.trim()) return;

    try {
      await updateDoc(doc(db, 'userPlants', plantId), {
        experience: experienceText.trim(),
        experienceCreatedAt: new Date(),
        updatedAt: new Date()
      });

      setExperienceText('');
      setShowExperienceModal(false);
      alert('Pengalaman Anda berhasil disimpan!');
    } catch (error) {
      console.error("Error saving experience:", error);
      alert('Gagal menyimpan pengalaman. Silakan coba lagi.');
    }
  };

  const updateProgress = () => {
    if (!plantData?.targets) return 0;

    const completed = plantData.targets.reduce((count, _, index) => {
      return count + (targetStatus[index] === 'checked' ? 1 : 0);
    }, 0);

    return (completed / plantData.targets.length) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'berhasil': return 'text-green-600 bg-green-100';
      case 'gagal': return 'text-red-600 bg-red-100';
      case 'batal': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'berhasil': return '✅ Berhasil';
      case 'gagal': return '❌ Gagal';
      case 'batal': return '⏸️ Dibatalkan';
      default: return '🌱 Sedang Berlangsung';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const days = [];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} className="p-2 text-gray-300" />);
    }

    for (let i = 1; i <= totalDays; i++) {
      const isToday = i === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();

      days.push(
        <td key={`day-${i}`} className="p-2 text-center">
          <div className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-yellow-500 text-white' : ''}`}>
            {i}
          </div>
        </td>
      );
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(<tr key={`week-${i}`}>{days.slice(i, i + 7)}</tr>);
    }

    return weeks;
  };

  if (isLoading || !plantData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tanaman...</p>
        </div>
      </div>
    );
  }

  const progress = updateProgress();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#E5B961] flex justify-between items-center p-4">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/home')}>
          <img src="/logo wefarm.png" alt="WeFarm Logo" className="h-20 mr-2" />
          <h1 className="text-xl font-bold">My Tracker</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 flex flex-col md:flex-row gap-4">
        {/* Calendar */}
        <div className="text-black bg-[#F5D88C] p-4 rounded-lg md:w-1/4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigateMonth(-1)}>
              <FiChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold">
              {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => navigateMonth(1)}>
              <FiChevronRight size={24} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-600">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <th key={i} className="p-2 text-center">{d}</th>)}
              </tr>
            </thead>
            <tbody>{renderCalendar()}</tbody>
          </table>
        </div>

        {/* Tracker Info */}
        <div className="flex-1 text-gray-600">
          <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg">
            <img src={plantData.image} alt={plantName} className="w-32 h-32 object-cover rounded" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-gray-800 text-xl font-bold">{plantName}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plantOverallStatus)}`}>
                  {getStatusText(plantOverallStatus)}
                </span>
              </div>
              <p><b>ID:</b> {plantId}</p>
              <p><b>Start:</b> {plantData.start}</p>
              <p><b>Estimated:</b> {plantData.estimated}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm">{Math.round(progress)}%</span>
              </div>

              {/* Status Control Buttons */}
              {!plantOverallStatus ? (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => confirmStatusChange('gagal')}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Gagal
                  </button>
                  <button
                    onClick={() => confirmStatusChange('batal')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    onClick={() => confirmStatusChange(null)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Reset Status
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Target:</h3>
            <ul className="space-y-2">
              {plantData.targets?.map((target, index) => (
                <li key={index} className={`flex items-center p-3 rounded ${targetStatus[index] === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <button
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-4 transition-all hover:scale-105
                                            ${targetStatus[index] === 'checked' ? 'border-green-500 bg-green-500 text-white'
                        : targetStatus[index] === 'failed' ? 'border-red-500 bg-red-500 text-white'
                          : 'border-gray-300 hover:border-yellow-500'}`}
                    onClick={() => handleTargetClick(index)}
                    disabled={plantOverallStatus === 'gagal' || plantOverallStatus === 'batal'}
                  >
                    {targetStatus[index] === 'checked' && <FiCheck size={20} />}
                    {targetStatus[index] === 'failed' && <FiAlertCircle size={20} />}
                  </button>
                  <span className="flex-grow">{target}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Daily:</h3>
            <div className="space-y-2">
              {plantData.dailies?.map((daily, index) => (
                <label key={index} className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mr-2 w-4 h-4"
                    checked={!!dailiesStatus[index]}
                    onChange={() => handleDailyToggle(index)}
                    disabled={plantOverallStatus === 'gagal' || plantOverallStatus === 'batal'}
                  />
                  {daily}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Don&apos;t Miss Out!</h3>
            <p>⏳ <b>{plantData.growthDuration || 3} Bulan to Go</b></p>
            <p>Periksa tanaman Anda secara rutin untuk hasil terbaik.</p>
          </div>

          <button className="mt-6 bg-yellow-500 px-4 py-2 rounded flex items-center" onClick={() => router.push('/myTrack')}>
            <FiChevronLeft className="mr-1" /> Back
          </button>
        </div>
      </main>

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Bagikan Pengalaman Anda</h3>
            <p className="text-gray-600 mb-4">
              Ceritakan pengalaman Anda menanam {plantName}!
            </p>
            <textarea
              value={experienceText}
              onChange={(e) => setExperienceText(e.target.value)}
              placeholder={`Bagikan tips, tantangan, atau hasil dari menanam ${plantName}...`}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={5}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mb-4">
              {experienceText.length}/500 karakter
            </div>
            <div className="flex gap-3">
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1 hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowExperienceModal(false);
                  setExperienceText('');
                }}
              >
                Lewati
              </button>
              <button
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded flex-1 transition-colors disabled:opacity-50"
                onClick={handleExperienceSubmit}
                disabled={!experienceText.trim()}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Status Modal */}
      {showTargetModal && (
        <div className="fixed text-black inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Status Target</h3>
            <p className="text-gray-600 mb-6">
              Bagaimana status target ini?
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded transition-colors flex items-center justify-center gap-2"
                onClick={() => handleTargetStatusChange('checked')}
              >
                <FiCheck size={20} />
                Berhasil Diselesaikan
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded transition-colors flex items-center justify-center gap-2"
                onClick={() => handleTargetStatusChange('failed')}
              >
                <FiAlertCircle size={20} />
                Gagal Dicapai
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-3 rounded hover:bg-gray-400 transition-colors"
                onClick={() => handleTargetStatusChange(null)}
              >
                Reset Status
              </button>
              <button
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                onClick={() => setShowTargetModal(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {pendingStatus === 'gagal' && 'Tandai sebagai Gagal?'}
              {pendingStatus === 'batal' && 'Batalkan Tanaman?'}
              {pendingStatus === null && 'Reset Status Tanaman?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {pendingStatus === 'gagal' && 'Tanaman akan ditandai sebagai gagal. Anda masih bisa melihat progress yang sudah dibuat.'}
              {pendingStatus === 'batal' && 'Tanaman akan dibatalkan. Status ini dapat diubah kembali nanti.'}
              {pendingStatus === null && 'Status tanaman akan dikembalikan ke kondisi normal dan dapat dilanjutkan kembali.'}
            </p>
            <div className="flex gap-3">
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1 hover:bg-gray-400 transition-colors"
                onClick={() => setShowStatusModal(false)}
              >
                Batal
              </button>
              <button
                className={`px-4 py-2 rounded flex-1 text-white transition-colors ${pendingStatus === 'gagal' ? 'bg-red-500 hover:bg-red-600' :
                    pendingStatus === 'batal' ? 'bg-gray-500 hover:bg-gray-600' :
                      'bg-blue-500 hover:bg-blue-600'
                  }`}
                onClick={() => handlePlantStatusChange(pendingStatus)}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Tanaman anda berhasil?</h3>
            <div className="flex gap-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded flex-1"
                onClick={() => {
                  alert('Selamat! Tanaman Anda berhasil tumbuh dengan baik!');
                  setShowModal(false);
                }}
              >
                Berhasil
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded flex-1"
                onClick={() => {
                  alert('Tanaman Anda gagal tumbuh. Mari coba lagi!');
                  setShowModal(false);
                }}
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}