import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Award, 
  IdCard, 
  FileText, 
  DraftingCompass, 
  Satellite, 
  Home, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Calendar, 
  MapPin,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Booking {
  id: number;
  name: string;
  location: string;
  date: string;
  work_type?: string;
  image_data?: string;
  status?: 'scheduled' | 'delayed' | 'completed';
  delay_days?: number;
  original_date?: string;
}

interface Admin {
  id: number;
  username: string;
  is_main: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'admin'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // Form states
  const [newBookingName, setNewBookingName] = useState('');
  const [newBookingLoc, setNewBookingLoc] = useState('');
  const [newBookingDate, setNewBookingDate] = useState('');
  const [newWorkType, setNewWorkType] = useState('');
  const [newImageData, setNewImageData] = useState<string | null>(null);

  // Admin management states
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Edit/Delay states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [delayingBooking, setDelayingBooking] = useState<Booking | null>(null);
  const [delayDays, setDelayDays] = useState(1);
  const [newDelayDate, setNewDelayDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (isLoggedIn && isMainAdmin) {
      fetchAdmins();
    }
  }, [isLoggedIn, isMainAdmin]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, password: adminPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
        setIsMainAdmin(data.is_main);
        setActionMessage('সফলভাবে লগইন হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setLoginError('ভুল আইডি বা পাসওয়ার্ড!');
      }
    } catch (error) {
      setLoginError('সার্ভার ত্রুটি!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setBookingError('ছবিটি ৫০ মেগাবাইটের বেশি বড়! ছোট ছবি দিন।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageData(reader.result as string);
        setBookingError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBooking = async () => {
    setBookingError(null);
    const name = newBookingName.trim();
    const date = newBookingDate.trim();
    
    console.log('Attempting to add booking:', { name, date });
    
    if (!name && !date) {
      setBookingError('নাম এবং তারিখ অবশ্যই দিতে হবে!');
      return;
    }
    if (!name) {
      setBookingError('ক্লায়েন্টের নাম অবশ্যই দিতে হবে!');
      return;
    }
    if (!date) {
      setBookingError('তারিখ অবশ্যই দিতে হবে!');
      return;
    }
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name, 
          location: newBookingLoc.trim() || '', 
          date: date,
          work_type: newWorkType.trim() || '',
          image_data: newImageData || null
        }),
      });
      if (res.ok) {
        setNewBookingName('');
        setNewBookingLoc('');
        setNewBookingDate('');
        setNewWorkType('');
        setNewImageData(null);
        fetchBookings();
        setActionMessage('বুকিং লিস্টে যোগ হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        const errorData = await res.json();
        setBookingError(`বুকিং যোগ করতে ব্যর্থ হয়েছে: ${errorData.details || 'অজানা ত্রুটি'}`);
      }
    } catch (error: any) {
      console.error('Add booking error:', error);
      setBookingError(`সার্ভার ত্রুটি: ${error.message || 'সংযোগ বিচ্ছিন্ন'}`);
    }
  };

  const resetBookingForm = () => {
    setNewBookingName('');
    setNewBookingLoc('');
    setNewBookingDate('');
    setNewWorkType('');
    setNewImageData(null);
    setEditingBooking(null);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;
    setBookingError(null);
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooking),
      });
      if (res.ok) {
        setEditingBooking(null);
        fetchBookings();
        setActionMessage('বুকিং আপডেট হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        const errorData = await res.json();
        setBookingError(`বুকিং আপডেট করতে ব্যর্থ হয়েছে: ${errorData.details || 'অজানা ত্রুটি'}`);
      }
    } catch (error: any) {
      console.error('Update booking error:', error);
      setBookingError(`আপডেট করতে সার্ভার ত্রুটি: ${error.message || 'সংযোগ বিচ্ছিন্ন'}`);
    }
  };

  const handleDelayBooking = async () => {
    if (!delayingBooking || !newDelayDate) return;
    try {
      const updatedBooking = {
        ...delayingBooking,
        status: 'delayed',
        delay_days: delayDays,
        original_date: delayingBooking.original_date || delayingBooking.date,
        date: newDelayDate
      };
      const res = await fetch(`/api/bookings/${delayingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking),
      });
      if (res.ok) {
        setDelayingBooking(null);
        fetchBookings();
        setActionMessage('বুকিং ডিলে করা হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      setActionMessage('ডিলে করতে ব্যর্থ হয়েছে!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই বুকিংটি ডিলিট করতে চান?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBookings();
        setActionMessage('বুকিং ডিলিট হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      setActionMessage('ডিলিট করতে ব্যর্থ হয়েছে!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminUser || !newAdminPass) return;
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass }),
      });
      if (res.ok) {
        setNewAdminUser('');
        setNewAdminPass('');
        fetchAdmins();
        setActionMessage('নতুন অ্যাডমিন যোগ হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      setActionMessage('অ্যাডমিন যোগ করতে ব্যর্থ হয়েছে!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অ্যাডমিনকে ডিলিট করতে চান?')) return;
    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdmins();
        setActionMessage('অ্যাডমিন ডিলিট হয়েছে!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (error) {
      setActionMessage('ডিলিট করতে ব্যর্থ হয়েছে!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Satellite className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg text-blue-900">মো: সাদিকুল ইসলাম</h1>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
          <span>সরকারি সনদ প্রাপ্ত</span>
        </div>
      </header>

      {/* Action Message Toast */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm border border-slate-700">
              {actionMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white px-6 py-12 text-center relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <motion.h2 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-3xl md:text-4xl font-extrabold tracking-tight"
                  >
                    মো: সাদিকুল ইসলাম
                  </motion.h2>
                  <p className="text-blue-100 text-lg font-medium">ডিজিটাল ভূমি সার্ভেয়ার (আমিন)</p>
                  <p className="text-blue-200 text-sm">সরকারি সনদ প্রাপ্ত সার্ভেয়ার</p>
                  
                  <div className="inline-grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-left">
                    <div className="flex items-center gap-3">
                      <IdCard className="text-blue-300" />
                      <div>
                        <p className="text-xs text-blue-200 uppercase tracking-wider">রেজিঃ নং</p>
                        <p className="font-mono font-bold">৩০০২৩২৫৬১২</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-300" />
                      <div>
                        <p className="text-xs text-blue-200 uppercase tracking-wider">সনদ নং</p>
                        <p className="font-mono font-bold">২৩০১০০০২</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
              </section>

              {/* Contact Buttons */}
              <section className="px-6 -mt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <a 
                    href="tel:+8801725345422" 
                    className="flex items-center justify-center gap-3 bg-white text-blue-700 border-2 border-blue-100 px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    <Phone className="w-6 h-6" />
                    কল করুন: ০১৭২৫৩৪৫৪২২
                  </a>
                  <a 
                    href="https://wa.me/8801321554340" 
                    className="flex items-center justify-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    <MessageSquare className="w-6 h-6" />
                    হোয়াটসঅ্যাপ করুন
                  </a>
                </div>
              </section>

              {/* Booking List */}
              <section className="px-6">
                <div className="flex items-center gap-2 mb-6 justify-center">
                  <Calendar className="text-blue-600 w-6 h-6" />
                  <h3 className="text-2xl font-bold text-slate-800">বুকিং লিস্ট</h3>
                </div>
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map((b) => (
                      <div key={b.id} className="bg-white p-5 rounded-2xl border-l-8 border-blue-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-sm font-medium">নাম:</span>
                            <span className="font-bold text-slate-800">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-600">{b.date}</span>
                            {b.status === 'delayed' && (
                              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                ডিলে: {b.delay_days} দিন (মূল তারিখ: {b.original_date})
                              </span>
                            )}
                          </div>
                          {b.work_type && (
                            <div className="flex items-center gap-2">
                              <DraftingCompass className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600 text-sm italic">{b.work_type}</span>
                            </div>
                          )}
                          {b.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{b.location}</span>
                            </div>
                          )}
                        </div>
                        {b.image_data && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                            <img src={b.image_data} alt="Design" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`px-4 py-1 rounded-full text-sm font-bold border self-start md:self-center ${
                          b.status === 'delayed' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {b.status === 'delayed' ? 'ডিলে' : 'নির্ধারিত'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">কোন নতুন বুকিং নেই।</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Services */}
              <section className="px-6 pb-12">
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">আমাদের সেবাসমূহ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                      <DraftingCompass className="text-blue-600 w-8 h-8 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-3">অটোক্যাড ও নকশা</h4>
                    <p className="text-slate-600 leading-relaxed">
                      কম্পিউটার অটোক্যাড স্কেলের মাধ্যমে জমির নিখুঁত ও আধুনিক নকশা প্রণয়ন। মৌজা ম্যাপের সাথে ডিজিটাল সমন্বয়।
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                      <Satellite className="text-blue-600 w-8 h-8 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-3">ডিজিটাল সার্ভে</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Total Station এবং GPS মেশিনের সাহায্যে জমি পরিমাপ ও সীমানা নির্ধারণ। নিখুঁত পরিমাপের নিশ্চয়তা।
                    </p>
                  </div>
                </div>
              </section>

              {/* Footer / Address */}
              <footer className="px-6 py-12 bg-slate-50 border-t border-slate-200">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="flex items-center justify-center gap-2 mb-4 text-blue-600">
                    <MapPin className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">যোগাযোগের ঠিকানা</span>
                  </div>
                  <p className="text-lg text-slate-700 font-medium leading-relaxed">
                    নয়াগোলা ঘাটপাড়া, নয়াগোলা হাট, চাঁপাইনবাবগঞ্জ সদর, চাঁপাইনবাবগঞ্জ।
                  </p>
                  <div className="mt-8 pt-8 border-t border-slate-200 text-slate-400 text-sm">
                    © {new Date().getFullYear()} ডিজিটাল সার্ভে ও অটোক্যাড নকশা। সর্বস্বত্ব সংরক্ষিত।
                  </div>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 py-12"
            >
              {!isLoggedIn ? (
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                  <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="text-blue-600 w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">অ্যাডমিন লগইন</h3>
                    <p className="text-slate-500 text-sm mt-1">কন্ট্রোল প্যানেলে প্রবেশ করুন</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">অ্যাডমিন আইডি</label>
                      <input 
                        type="text" 
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="অ্যাডমিন আইডি"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">পাসওয়ার্ড</label>
                      <input 
                        type="password" 
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="পাসওয়ার্ড"
                      />
                    </div>
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                      লগইন করুন
                    </button>
                    {loginError && (
                      <p className="text-red-500 text-sm font-bold text-center mt-3 bg-red-50 py-2 rounded-lg border border-red-100">
                        {loginError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-800">অ্যাডমিন কন্ট্রোল</h3>
                    <button 
                      onClick={() => { setIsLoggedIn(false); setIsMainAdmin(false); }}
                      className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      লগআউট
                    </button>
                  </div>

                  {/* Admin Management (Main Admin Only) */}
                  {isMainAdmin && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-6">
                        <ShieldCheck className="text-blue-600" />
                        <h4 className="text-xl font-bold text-slate-800">অ্যাডমিন ম্যানেজমেন্ট</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input 
                          type="text" 
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="নতুন অ্যাডমিন আইডি"
                        />
                        <input 
                          type="password" 
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="পাসওয়ার্ড"
                        />
                      </div>
                      <button 
                        onClick={handleAddAdmin}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mb-6"
                      >
                        অ্যাডমিন যোগ করুন
                      </button>
                      <div className="space-y-2">
                        {admins.map(admin => (
                          <div key={admin.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-medium text-slate-700">{admin.username} {admin.is_main ? '(মেইন)' : ''}</span>
                            {!admin.is_main && (
                              <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Form */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                      <Plus className="text-emerald-600" />
                      <h4 className="text-xl font-bold text-slate-800">
                        {editingBooking ? 'বুকিং এডিট করুন' : 'নতুন বুকিং যোগ করুন'}
                      </h4>
                      {editingBooking && (
                        <button 
                          onClick={() => setEditingBooking(null)}
                          className="ml-auto text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 hover:bg-slate-200"
                        >
                          নতুন বুকিং যোগ করুন
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        value={editingBooking ? editingBooking.name : newBookingName}
                        onChange={(e) => {
                          const val = e.target.value;
                          console.log('Name change:', val);
                          editingBooking ? setEditingBooking({...editingBooking, name: val}) : setNewBookingName(val);
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="ক্লায়েন্টের নাম"
                      />
                      <input 
                        type="text" 
                        value={editingBooking ? editingBooking.location : newBookingLoc}
                        onChange={(e) => {
                          const val = e.target.value;
                          editingBooking ? setEditingBooking({...editingBooking, location: val}) : setNewBookingLoc(val);
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="স্থান/ঠিকানা"
                      />
                      <input 
                        type="text" 
                        value={editingBooking ? editingBooking.work_type : newWorkType}
                        onChange={(e) => {
                          const val = e.target.value;
                          editingBooking ? setEditingBooking({...editingBooking, work_type: val}) : setNewWorkType(val);
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="কাজের ধরন (ঐচ্ছিক)"
                      />
                      <input 
                        type="date" 
                        value={editingBooking ? editingBooking.date : newBookingDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          console.log('Date change:', val);
                          editingBooking ? setEditingBooking({...editingBooking, date: val}) : setNewBookingDate(val);
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">নকশার ছবি (ঐচ্ছিক)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {(newImageData || editingBooking?.image_data) && (
                        <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                          <img src={newImageData || editingBooking?.image_data} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={editingBooking ? handleUpdateBooking : handleAddBooking}
                        disabled={editingBooking ? (!editingBooking.name || !editingBooking.date) : (!newBookingName || !newBookingDate)}
                        className={`flex-1 text-white font-bold py-4 rounded-xl transition-colors shadow-lg ${
                          editingBooking 
                            ? (editingBooking.name && editingBooking.date ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed') 
                            : (newBookingName && newBookingDate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed')
                        }`}
                      >
                        {editingBooking ? 'আপডেট করুন' : 'লিস্টে যোগ করুন'}
                      </button>
                      {editingBooking ? (
                        <button 
                          onClick={() => setEditingBooking(null)}
                          className="px-8 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                        >
                          বাতিল
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setNewBookingName('');
                            setNewBookingLoc('');
                            setNewBookingDate('');
                            setNewWorkType('');
                            setNewImageData(null);
                            setBookingError(null);
                          }}
                          className="px-8 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          মুছে ফেলুন
                        </button>
                      )}
                    </div>
                    {bookingError && (
                      <p className="text-red-500 text-sm font-bold text-center mt-3 bg-red-50 py-2 rounded-lg border border-red-100">
                        {bookingError}
                      </p>
                    )}
                  </div>

                  {/* Delay Modal (Simple Overlay) */}
                  {delayingBooking && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
                      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6">
                        <h4 className="text-xl font-bold text-slate-800">বুকিং ডিলে করুন</h4>
                        <p className="text-slate-500">ক্লায়েন্ট: {delayingBooking.name}</p>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">কত দিন ডিলে?</label>
                          <input 
                            type="number" 
                            value={delayDays}
                            onChange={(e) => setDelayDays(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">নতুন তারিখ</label>
                          <input 
                            type="date" 
                            value={newDelayDate}
                            onChange={(e) => setNewDelayDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={handleDelayBooking}
                            className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 transition-colors"
                          >
                            ডিলে সেভ করুন
                          </button>
                          <button 
                            onClick={() => setDelayingBooking(null)}
                            className="px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-xl font-bold text-slate-800 mb-6">বুকিং ম্যানেজমেন্ট</h4>
                    <div className="space-y-4">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800">{b.name}</p>
                              <p className="text-sm text-slate-500">{b.date} • {b.location || 'ঠিকানা নেই'}</p>
                              {b.status === 'delayed' && (
                                <p className="text-xs text-amber-600 font-bold">ডিলে: {b.delay_days} দিন</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingBooking(b)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="এডিট"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => { setDelayingBooking(b); setNewDelayDate(b.date); }}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="ডিলে"
                              >
                                <Calendar className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBooking(b.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="ডিলিট"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {bookings.length === 0 && (
                        <p className="text-center text-slate-400 py-8">কোন বুকিং পাওয়া যায়নি।</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-bold">হোম</span>
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <ShieldCheck className="w-6 h-6" />
          <span className="text-xs font-bold">অ্যাডমিন</span>
        </button>
      </nav>

      <footer className="bg-slate-900 text-slate-400 text-center py-12 px-6 mt-12">
        <p className="text-sm">&copy; ২০২৬ মো: সাদিকুল ইসলাম। সকল অধিকার সংরক্ষিত।</p>
        <p className="text-xs mt-2 opacity-50 tracking-widest uppercase">Digital Land Surveyor • Chapainawabganj</p>
      </footer>
    </div>
  );
}
