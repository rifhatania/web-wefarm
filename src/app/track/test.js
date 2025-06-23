// "use client";

// import { useEffect, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Head from 'next/head';
// import { FiCheck, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// import { auth, db } from '../../../lib/firebase';
// import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// export default function TrackPlant() {
//     const searchParams = useSearchParams();
//     const router = useRouter();

//     const [plantName, setPlantName] = useState(null);
//     const [currentDate, setCurrentDate] = useState(new Date());
//     const [showModal, setShowModal] = useState(false);
//     const [targetStatus, setTargetStatus] = useState({});
//     const [dailiesStatus, setDailiesStatus] = useState({});
//     const [isLoading, setIsLoading] = useState(true);
//     const [plantData, setPlantData] = useState(null);
//     const [currentUser, setCurrentUser] = useState(null);

//     const todayKey = new Date().toISOString().split('T')[0];

//     useEffect(() => {
//         const unsubscribe = auth.onAuthStateChanged(user => {
//             setCurrentUser(user);
//         });
//         return () => unsubscribe();
//     }, []);

//     useEffect(() => {
//         const queryPlant = searchParams.get('plant');
//         if (!queryPlant) {
//             router.push('/myTrack');
//             return;
//         }

//         if (currentUser) {
//             setPlantName(queryPlant);
//             const docRef = doc(db, 'userPlants', `${currentUser.uid}_${queryPlant}`);

//             const unsubscribe = onSnapshot(docRef, snapshot => {
//                 if (snapshot.exists()) {
//                     const data = snapshot.data();
//                     const startDate = data.startDate?.toDate();
//                     const estimated = new Date(startDate);
//                     estimated.setMonth(estimated.getMonth() + (data.estimatedHarvest || 3));

//                     setPlantData({
//                         ...data,
//                         start: startDate?.toLocaleDateString("id-ID"),
//                         estimated: estimated?.toLocaleDateString("id-ID"),
//                         image: data.plantImage,
//                         targets: data.targets || [],
//                         dailies: data.dailies || []
//                     });

//                     setTargetStatus(data.targetStatus || {});

//                     const allDailyStatuses = data.dailiesStatus || {};
//                     const todayStatus = allDailyStatuses[todayKey] || {};
//                     const defaultStatus = {};
//                     (data.dailies || []).forEach((_, i) => {
//                         defaultStatus[i] = !!todayStatus[i];
//                     });
//                     setDailiesStatus(defaultStatus);

//                     setIsLoading(false);
//                 } else {
//                     router.push('/myTrack');
//                 }
//             });

//             return () => unsubscribe();
//         }
//     }, [searchParams, currentUser]);

//     const handleStatusClick = async (index, status) => {
//         if (!currentUser || !plantName) return;

//         try {
//             const newStatus = { ...targetStatus, [index]: status };
//             setTargetStatus(newStatus);

//             const completed = plantData.targets.filter((_, i) => newStatus[i] === 'checked').length;
//             const progress = (completed / plantData.targets.length) * 100;

//             await updateDoc(doc(db, 'userPlants', `${currentUser.uid}_${plantName}`), {
//                 targetStatus: newStatus,
//                 progress: progress
//             });

//         } catch (error) {
//             console.error("Error updating status:", error);
//             setTargetStatus(prev => ({ ...prev, [index]: undefined }));
//         }
//     };

//     const handleDailyToggle = async (index) => {
//         if (!currentUser || !plantName) return;

//         try {
//             const newStatus = { ...dailiesStatus, [index]: !dailiesStatus[index] };
//             setDailiesStatus(newStatus);

//             const docRef = doc(db, 'userPlants', `${currentUser.uid}_${plantName}`);
//             const currentDoc = plantData.dailiesStatus || {};

//             await updateDoc(docRef, {
//                 dailiesStatus: {
//                     ...currentDoc,
//                     [todayKey]: newStatus
//                 }
//             });
//         } catch (error) {
//             console.error("Error updating daily status:", error);
//             setDailiesStatus(prev => ({ ...prev }));
//         }
//     };

//     const updateProgress = () => {
//         if (!plantData?.targets) return 0;

//         const completed = plantData.targets.reduce((count, _, index) => {
//             return count + (targetStatus[index] === 'checked' ? 1 : 0);
//         }, 0);

//         return (completed / plantData.targets.length) * 100;
//     };

//     const renderCalendar = () => {
//         const days = [];
//         const month = currentDate.getMonth();
//         const year = currentDate.getFullYear();
//         const totalDays = new Date(year, month + 1, 0).getDate();
//         const firstDay = new Date(year, month, 1).getDay();

//         for (let i = 0; i < firstDay; i++) {
//             days.push(<td key={`empty-${i}`} className="p-2 text-gray-300" />);
//         }

//         for (let i = 1; i <= totalDays; i++) {
//             const isToday = i === new Date().getDate() &&
//                 month === new Date().getMonth() &&
//                 year === new Date().getFullYear();

//             days.push(
//                 <td key={`day-${i}`} className="p-2 text-center">
//                     <div className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-yellow-500 text-white' : ''}`}>
//                         {i}
//                     </div>
//                 </td>
//             );
//         }

//         const weeks = [];
//         for (let i = 0; i < days.length; i += 7) {
//             weeks.push(<tr key={`week-${i}`}>{days.slice(i, i + 7)}</tr>);
//         }

//         return weeks;
//     };

//     if (isLoading || !plantData) {
//         return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
//     }

//     const progress = updateProgress();

//     return (
//         <div className="min-h-screen bg-gray-100">
//             <Head>
//                 <title>My Tracker - {plantName}</title>
//             </Head>

//             <header className="bg-[#E5B961] flex justify-between items-center p-4">
//                 <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
//                     <img src="/logo wefarm.png" alt="WeFarm Logo" className="h-20 mr-2" />
//                     <h1 className="text-xl font-bold">My Tracker</h1>
//                 </div>
//             </header>

//             <main className="container mx-auto p-4 flex flex-col md:flex-row gap-4">
//                 {/* Calendar */}
//                 <div className="bg-[#F5D88C] p-4 rounded-lg md:w-1/4">
//                     <div className="flex justify-between items-center mb-4">
//                         <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
//                             <FiChevronLeft size={24} />
//                         </button>
//                         <h2 className="text-lg font-semibold">
//                             {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][currentDate.getMonth()]} {currentDate.getFullYear()}
//                         </h2>
//                         <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
//                             <FiChevronRight size={24} />
//                         </button>
//                     </div>
//                     <table className="w-full">
//                         <thead>
//                             <tr className="text-gray-600">
//                                 {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <th key={i} className="p-2 text-center">{d}</th>)}
//                             </tr>
//                         </thead>
//                         <tbody>{renderCalendar()}</tbody>
//                     </table>
//                 </div>

//                 {/* Tracker Info */}
//                 <div className="flex-1 text-gray-600">
//                     <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg">
//                         <img src={plantData.image} alt={plantName} className="w-32 h-32 object-cover rounded" />
//                         <div>
//                             <h3 className="text-gray-800 text-xl font-bold">{plantName}</h3>
//                             <p><b>Start:</b> {plantData.start}</p>
//                             <p><b>Estimated:</b> {plantData.estimated}</p>
//                             <div className="flex items-center gap-2 mt-2">
//                                 <div className="w-full bg-gray-200 rounded-full h-2.5">
//                                     <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
//                                 </div>
//                                 <span className="text-sm">{Math.round(progress)}%</span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="mt-6">
//                         <h3 className="text-lg font-semibold mb-2">Target:</h3>
//                         <ul className="space-y-2">
//                             {plantData.targets?.map((target, index) => (
//                                 <li key={index} className={`flex items-center p-3 rounded ${targetStatus[index] === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
//                                     <button
//                                         className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-4 transition-all hover:scale-105
//                                             ${targetStatus[index] === 'checked' ? 'border-green-500 bg-green-500 text-white'
//                                                 : targetStatus[index] === 'failed' ? 'border-red-500 bg-red-500 text-white'
//                                                     : 'border-gray-300 hover:border-yellow-500'}`}
//                                         onClick={() => {
//                                             if (confirm("Sudah selesai target ini?")) {
//                                                 handleStatusClick(index, 'checked');
//                                             } else if (confirm("Gagal mencapai target?")) {
//                                                 handleStatusClick(index, 'failed');
//                                             } else {
//                                                 handleStatusClick(index, null);
//                                             }
//                                         }}
//                                     >
//                                         {targetStatus[index] === 'checked' && <FiCheck size={20} />}
//                                         {targetStatus[index] === 'failed' && <FiAlertCircle size={20} />}
//                                     </button>
//                                     <span className="flex-grow">{target}</span>
//                                     {targetStatus[index] === 'failed' && (
//                                         <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm ml-4">Baca Artikel</button>
//                                     )}
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>

//                     <div className="mt-6">
//                         <h3 className="text-lg font-semibold mb-2">Daily:</h3>
//                         <div className="space-y-2">
//                             {plantData.dailies?.map((daily, index) => (
//                                 <label key={index} className="flex items-center cursor-pointer select-none">
//                                     <input
//                                         type="checkbox"
//                                         className="mr-2 w-4 h-4"
//                                         checked={!!dailiesStatus[index]}
//                                         onChange={() => handleDailyToggle(index)}
//                                     />
//                                     {daily}
//                                 </label>
//                             ))}
//                         </div>
//                     </div>
//                     <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
//                         <h3 className="text-lg font-semibold mb-2">Don't Miss Out!</h3>
//                         <p>⏳ <b>{plantData.growthDuration || 3} Bulan to Go</b></p>
//                         <p>Periksa tanaman Anda secara rutin untuk hasil terbaik.</p>
//                     </div>

//                     <button className="mt-6 bg-yellow-500 px-4 py-2 rounded flex items-center" onClick={() => router.push('/myTrack')}>
//                         <FiChevronLeft className="mr-1" /> Back
//                     </button>
//                 </div>
//             </main>

//             {showModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                     <div className="bg-white p-6 rounded-lg max-w-sm w-full">
//                         <h3 className="text-xl font-bold mb-4">Tanaman anda berhasil?</h3>
//                         <div className="flex gap-4">
//                             <button
//                                 className="bg-green-500 text-white px-4 py-2 rounded flex-1"
//                                 onClick={() => {
//                                     alert('Selamat! Tanaman Anda berhasil tumbuh dengan baik!');
//                                     setShowModal(false);
//                                 }}
//                             >
//                                 Berhasil
//                             </button>
//                             <button
//                                 className="bg-red-500 text-white px-4 py-2 rounded flex-1"
//                                 onClick={() => {
//                                     alert('Tanaman Anda gagal tumbuh. Mari coba lagi!');
//                                     setShowModal(false);
//                                 }}
//                             >
//                                 Tidak
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }



// // "use client";

// // import { useEffect, useState } from 'react';
// // import { useRouter, useSearchParams } from 'next/navigation';
// // import Head from 'next/head';
// // import Image from 'next/image';
// // import Link from 'next/link';
// // import { FiCheck, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// // import { auth, db } from '../../../lib/firebase';
// // import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// // export default function TrackPlant() {
// //     const searchParams = useSearchParams();
// //     const router = useRouter();

// //     const [plantName, setPlantName] = useState(null);
// //     const [currentDate, setCurrentDate] = useState(new Date());
// //     const [showModal, setShowModal] = useState(false);
// //     const [targetStatus, setTargetStatus] = useState({});
// //     const [isLoading, setIsLoading] = useState(true);
// //     const [plantData, setPlantData] = useState(null);
// //     const [currentUser, setCurrentUser] = useState(null);

// //     useEffect(() => {
// //         const unsubscribe = auth.onAuthStateChanged(user => {
// //             setCurrentUser(user);
// //         });
// //         return () => unsubscribe();
// //     }, []);

// //     useEffect(() => {
// //         const queryPlant = searchParams.get('plant');
// //         if (!queryPlant) {
// //             router.push('/myTrack');
// //             return;
// //         }

// //         if (currentUser) {
// //             setPlantName(queryPlant);
// //             const docRef = doc(db, 'userPlants', `${currentUser.uid}_${queryPlant}`);

// //             const unsubscribe = onSnapshot(docRef, snapshot => {
// //                 if (snapshot.exists()) {
// //                     const data = snapshot.data();
// //                     const startDate = data.startDate?.toDate();
// //                     const estimated = new Date(startDate);
// //                     estimated.setMonth(estimated.getMonth() + (data.estimatedHarvest || 3));

// //                     setPlantData({
// //                         ...data,
// //                         start: startDate?.toLocaleDateString("id-ID"),
// //                         estimated: estimated?.toLocaleDateString("id-ID"),
// //                         image: data.plantImage,
// //                         targets: data.targets || [],
// //                         dailies: data.dailies || []
// //                     });

// //                     // Load saved target status
// //                     if (data.targetStatus) {
// //                         setTargetStatus(data.targetStatus);
// //                     }

// //                     setIsLoading(false);
// //                 } else {
// //                     router.push('/myTrack');
// //                 }
// //             });

// //             return () => unsubscribe();
// //         }
// //     }, [searchParams, currentUser]);

// //     const handleStatusClick = async (index, status) => {
// //         if (!currentUser || !plantName) return;

// //         try {
// //             // Update state lokal terlebih dahulu untuk responsivitas UI
// //             const newStatus = { ...targetStatus, [index]: status };
// //             setTargetStatus(newStatus);

// //             // Hitung progress terbaru
// //             const completed = plantData.targets.filter((_, i) => newStatus[i] === 'checked').length;
// //             const progress = (completed / plantData.targets.length) * 100;

// //             // Update ke Firestore
// //             await updateDoc(doc(db, 'userPlants', `${currentUser.uid}_${plantName}`), {
// //                 targetStatus: newStatus,
// //                 progress: progress
// //             });

// //         } catch (error) {
// //             console.error("Error updating status:", error);
// //             // Rollback state lokal jika gagal
// //             setTargetStatus(prev => ({ ...prev, [index]: undefined }));
// //         }
// //     };

// //     const handleDailyToggle = async (index) => {
// //         if (!currentUser || !plantName) return;

// //         const newDailiesStatus = { ...dailiesStatus, [index]: !dailiesStatus[index] };
// //         setDailiesStatus(newDailiesStatus);

// //         await updateDoc(doc(db, 'userPlants', `${currentUser.uid}_${plantName}`), {
// //             dailiesStatus: newDailiesStatus
// //         });
// //     };

// //     const updateProgress = () => {
// //         if (!plantData?.targets) return 0;

// //         const completed = plantData.targets.reduce((count, _, index) => {
// //             return count + (targetStatus[index] === 'checked' ? 1 : 0);
// //         }, 0);

// //         return (completed / plantData.targets.length) * 100;
// //     };

// //     const renderCalendar = () => {
// //         const days = [];
// //         const month = currentDate.getMonth();
// //         const year = currentDate.getFullYear();
// //         const totalDays = new Date(year, month + 1, 0).getDate();
// //         const firstDay = new Date(year, month, 1).getDay();

// //         for (let i = 0; i < firstDay; i++) {
// //             days.push(<td key={`empty-${i}`} className="p-2 text-gray-300" />);
// //         }

// //         for (let i = 1; i <= totalDays; i++) {
// //             const isToday = i === new Date().getDate() &&
// //                 month === new Date().getMonth() &&
// //                 year === new Date().getFullYear();

// //             days.push(
// //                 <td key={`day-${i}`} className="p-2 text-center">
// //                     <div className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-yellow-500 text-white' : ''}`}>
// //                         {i}
// //                     </div>
// //                 </td>
// //             );
// //         }

// //         const weeks = [];
// //         for (let i = 0; i < days.length; i += 7) {
// //             weeks.push(<tr key={`week-${i}`}>{days.slice(i, i + 7)}</tr>);
// //         }

// //         return weeks;
// //     };

// //     if (isLoading || !plantData) {
// //         return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
// //     }

// //     const progress = updateProgress();

// //     return (
// //         <div className="min-h-screen bg-gray-100">
// //             <Head>
// //                 <title>My Tracker - {plantName}</title>
// //             </Head>

// //             <header className="bg-[#E5B961] flex justify-between items-center p-4">
// //                 <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
// //                     <img src="/logo wefarm.png" alt="WeFarm Logo" className="h-20 mr-2" />
// //                     <h1 className="text-xl font-bold">My Tracker</h1>
// //                 </div>
// //             </header>

// //             <main className="container mx-auto p-4 flex flex-col md:flex-row gap-4">
// //                 {/* Calendar */}
// //                 <div className="bg-[#F5D88C] p-4 rounded-lg md:w-1/4">
// //                     <div className="flex justify-between items-center mb-4">
// //                         <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
// //                             <FiChevronLeft size={24} />
// //                         </button>
// //                         <h2 className="text-lg font-semibold">
// //                             {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][currentDate.getMonth()]} {currentDate.getFullYear()}
// //                         </h2>
// //                         <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
// //                             <FiChevronRight size={24} />
// //                         </button>
// //                     </div>
// //                     <table className="w-full">
// //                         <thead>
// //                             <tr className="text-gray-600">
// //                                 {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <th key={i} className="p-2 text-center">{d}</th>)}
// //                             </tr>
// //                         </thead>
// //                         <tbody>{renderCalendar()}</tbody>
// //                     </table>
// //                 </div>

// //                 {/* Tracker Info */}
// //                 <div className="flex-1 text-gray-600">
// //                     <div className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg">
// //                         <img src={plantData.image} alt={plantName} className="w-32 h-32 object-cover rounded" />
// //                         <div>
// //                             <h3 className="text-gray-800 text-xl font-bold">{plantName}</h3>
// //                             <p><b>Start:</b> {plantData.start}</p>
// //                             <p><b>Estimated:</b> {plantData.estimated}</p>
// //                             <div className="flex items-center gap-2 mt-2">
// //                                 <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                                     <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
// //                                 </div>
// //                                 <span className="text-sm">{Math.round(progress)}%</span>
// //                             </div>
// //                         </div>
// //                     </div>

// //                     <div className="mt-6">
// //                         <h3 className="text-lg font-semibold mb-2">Target:</h3>
// //                         <ul className="space-y-2">
// //                             {plantData.targets?.map((target, index) => (
// //                                 <li key={index} className={`flex items-center p-3 rounded ${targetStatus[index] === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
// //                                     <button
// //                                         className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-4 transition-all hover:scale-105
// //                                             ${targetStatus[index] === 'checked' ? 'border-green-500 bg-green-500 text-white'
// //                                                 : targetStatus[index] === 'failed' ? 'border-red-500 bg-red-500 text-white'
// //                                                     : 'border-gray-300 hover:border-yellow-500'}`}
// //                                         onClick={() => {
// //                                             if (confirm("Sudah selesai target ini?")) {
// //                                                 handleStatusClick(index, 'checked');
// //                                             } else if (confirm("Gagal mencapai target?")) {
// //                                                 handleStatusClick(index, 'failed');
// //                                             } else {
// //                                                 handleStatusClick(index, null);
// //                                             }
// //                                         }}
// //                                     >
// //                                         {targetStatus[index] === 'checked' && <FiCheck size={20} />}
// //                                         {targetStatus[index] === 'failed' && <FiAlertCircle size={20} />}
// //                                     </button>
// //                                     <span className="flex-grow">{target}</span>
// //                                     {targetStatus[index] === 'failed' && (
// //                                         <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm ml-4">Baca Artikel</button>
// //                                     )}
// //                                 </li>
// //                             ))}
// //                         </ul>
// //                     </div>

// //                     <div className="mt-6">
// //                         <h3 className="text-lg font-semibold mb-2">Daily:</h3>
// //                         <div className="space-y-2">
// //                             {plantData.dailies?.map((daily, index) => (
// //                                 <label key={index} className="flex items-center">
// //                                     <input type="checkbox" className="mr-2 w-4 h-4" />
// //                                     {daily}
// //                                 </label>
// //                             ))}
// //                         </div>
// //                     </div>

// //                     <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
// //                         <h3 className="text-lg font-semibold mb-2">Don't Miss Out!</h3>
// //                         <p>⏳ <b>{plantData.growthDuration || 3} Bulan to Go</b></p>
// //                         <p>Periksa tanaman Anda secara rutin untuk hasil terbaik.</p>
// //                     </div>

// //                     <button className="mt-6 bg-yellow-500 px-4 py-2 rounded flex items-center" onClick={() => router.push('/myTrack')}>
// //                         <FiChevronLeft className="mr-1" /> Back
// //                     </button>
// //                 </div>
// //             </main>

// //             {showModal && (
// //                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //                     <div className="bg-white p-6 rounded-lg max-w-sm w-full">
// //                         <h3 className="text-xl font-bold mb-4">Tanaman anda berhasil?</h3>
// //                         <div className="flex gap-4">
// //                             <button
// //                                 className="bg-green-500 text-white px-4 py-2 rounded flex-1"
// //                                 onClick={() => {
// //                                     alert('Selamat! Tanaman Anda berhasil tumbuh dengan baik!');
// //                                     setShowModal(false);
// //                                 }}
// //                             >
// //                                 Berhasil
// //                             </button>
// //                             <button
// //                                 className="bg-red-500 text-white px-4 py-2 rounded flex-1"
// //                                 onClick={() => {
// //                                     alert('Tanaman Anda gagal tumbuh. Mari coba lagi!');
// //                                     setShowModal(false);
// //                                 }}
// //                             >
// //                                 Tidak
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             )}
// //         </div>
// //     );
// // }