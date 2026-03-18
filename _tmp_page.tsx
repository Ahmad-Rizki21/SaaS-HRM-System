"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { 
  Users, UserCheck, UserX, Calendar as CalendarIcon, 
  MoreVertical, Eye, Plus, Search, Filter, X
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Image from "next/image";

interface DashboardData {
  total_employees: number;
  present_today: number;
  late_today: number;
  leave_today: number;
  absent_today: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewEmployeeId, setViewEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, userRes] = await Promise.all([
          axiosInstance.get("/dashboard/summary"),
          axiosInstance.get("/user")
        ]);
        setData(dashRes.data.data);
        setUser(userRes.data);
      } catch (e) {
        console.error("Gagal mendapatkan data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const summary = data || {
    total_employees: 0,
    present_today: 0,
    late_today: 0,
    leave_today: 0,
    absent_today: 0,
  };

  // Dummy data for charts
  const performanceData = [
    { name: 'Jan', design: 30, developer: 40 },
    { name: 'Feb', design: 45, developer: 30 },
    { name: 'Mar', design: 35, developer: 45 },
    { name: 'Apr', design: 30, developer: 30 },
    { name: 'May', design: 45, developer: 45 },
    { name: 'Jun', design: 55, developer: 50 },
    { name: 'Jul', design: 40, developer: 45 },
    { name: 'Aug', design: 50, developer: 30 },
    { name: 'Sep', design: 65, developer: 40 },
    { name: 'Oct', design: 60, developer: 35 },
    { name: 'Nov', design: 75, developer: 40 },
    { name: 'Dec', design: 80, developer: 45 },
  ];

  const donutData = [
    { name: 'Software Engineer', value: 50, color: '#8B0000' }, // Dark maroon
    { name: 'UI/UX Designer', value: 28, color: '#991b1b' },    // Maroon 800
    { name: 'Data Analyst', value: 25, color: '#b91c1c' },      // Maroon 700
    { name: 'Mobile Dev', value: 10, color: '#dc2626' },        // Maroon 600
    { name: 'Project Manager', value: 7, color: '#fca5a5' },    // Maroon 300
  ];

  const employeeStatus = [
    { id: '2563', name: 'John Smith', role: 'UI/UX Designer', status: 'Active', tl: 'Swidden V.' },
    { id: '2567', name: 'Anika Dorwart', role: 'React Developer', status: 'Active', tl: 'Kadin C.' },
    { id: '2569', name: 'Alfredo Saris', role: 'Graphic Designer', status: 'Inactive', tl: 'Kaiya F.' },
    { id: '2572', name: 'Jakob Gouse', role: 'Software Developer', status: 'Active', tl: 'Talan T.' },
  ];

  const upcomingEvents = [
    { title: 'Marketing Meeting', sub: 'Meeting', time: '8:00 am', date: '07/08/2024' },
    { title: 'Development meeting', sub: 'Job interview', time: '10:00 am', date: '08/08/2024' },
    { title: 'Safety', sub: 'Consulting', time: '11:30 am', date: '10/08/2024' },
    { title: 'Meeting with Designer', sub: 'Meeting', time: '13:00 pm', date: '11/08/2024' },
  ];

  const birthdays = [
    { name: 'Madelyn Philips', role: 'Sr. UX/UI Designer', date: '12/08/2024' },
    { name: 'Ann Stanton', role: 'HR Manager', date: '20/08/2024' },
    { name: 'Terry Saris', role: 'Software Developer', date: '22/08/2024' },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role?.name === "Karyawan" || user?.role?.name === "Staff Karyawan") {
    return (
      <div className="max-w-[1400px] mx-auto pb-8 animate-in fade-in duration-500">
        {/* Header Pegawai */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Personal Hub</h1>
            <p className="text-gray-500 font-medium">Selamat datang kembali, <span className="text-[#8B0000]">{user?.name}</span>. Apa rencana hebat hari ini?</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-[#fef2f2] p-2 rounded-xl text-[#8B0000]">
              <CalendarIcon size={20} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hari Ini</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal Focus */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-linear-to-br from-[#8B0000] to-[#5a0000] rounded-[2rem] p-6 text-white shadow-xl shadow-red-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-xs font-bold text-white/70 uppercase mb-2 tracking-widest">Absensi Bulan Ini</p>
                <div className="text-4xl font-black mb-1">22 <span className="text-lg font-medium text-white/50">/ 24</span></div>
                <p className="text-[10px] bg-white/20 inline-block px-2 py-1 rounded-lg font-bold">TINGKAT KEHADIRAN 92%</p>
              </div>
              
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Sisa Jatah Cuti</p>
                  <div className="text-3xl font-black text-gray-900">12 <span className="text-sm font-medium text-gray-400">Hari</span></div>
                </div>
                <button className="text-xs font-bold text-[#8B0000] flex items-center gap-1 mt-4 hover:gap-2 transition-all">
                  AJUKAN CUTI <Plus size={14} />
                </button>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Total Reimbursement</p>
                  <div className="text-3xl font-black text-gray-900">03 <span className="text-sm font-medium text-gray-400">Klaim</span></div>
                </div>
                <button className="text-xs font-bold text-[#8B0000] flex items-center gap-1 mt-4 hover:gap-2 transition-all">
                  TAMBAH KLAIM <Plus size={14} />
                </button>
              </div>
            </div>

            {/* My Activity Chart */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm shadow-gray-200/50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Statistik Jam Kerja</h3>
                <div className="bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500">6 BULAN TERAKHIR</div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="developer" stroke="#8B0000" strokeWidth={4} dot={{ r: 4, fill: '#8B0000', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#8B0000', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="space-y-8">
            {/* Announcements */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#8B0000] rounded-full"></div>
                Pengumuman Terbaru
              </h3>
              <div className="space-y-4">
                {upcomingEvents.slice(0, 2).map((evt, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 hover:bg-red-50/30 transition-all cursor-pointer group">
                    <p className="text-[10px] font-bold text-[#8B0000] uppercase tracking-widest mb-1">{evt.sub}</p>
                    <h4 className="font-bold text-gray-900 group-hover:text-[#8B0000] transition-colors">{evt.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{evt.date} • {evt.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* My Department Info */}
            <div className="bg-[#fef2f2] rounded-[2rem] p-8 border border-[#fee2e2] relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-black text-[#8B0000] text-2xl leading-none mb-1">Product Team</h3>
                 <p className="text-red-700/60 font-medium text-sm">Technology & Engineering</p>
                 <div className="mt-8 flex -space-x-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-4 border-[#fef2f2] bg-white flex items-center justify-center font-bold text-xs text-red-800">
                       {String.fromCharCode(64 + i)}
                     </div>
                   ))}
                   <div className="w-10 h-10 rounded-full border-4 border-[#fef2f2] bg-red-100 flex items-center justify-center font-bold text-xs text-red-800">
                     +12
                   </div>
                 </div>
                 <p className="text-[11px] text-red-700/50 mt-4 font-bold tracking-tight uppercase">TIM KAMU SEDANG AKTIF</p>
               </div>
               <div className="absolute bottom-0 right-0 opacity-10 -mr-8 -mb-8 scale-150">
                 <Users size={120} />
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-8">
      {/* Top Header Row for Layout Name */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm font-medium text-gray-500">
          {user?.role?.name || "Karyawan"} / <span className="text-gray-900">Home</span>
        </div>
      </div>

      {/* TOP ROW GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        
        {/* 1. Welcome Card (Col 1) */}
        <div className="bg-[#fef2f2] rounded-2xl p-6 flex flex-col items-center justify-between border border-[#fee2e2] text-center h-full min-h-[350px]">
          <div className="w-full flex justify-end">
            <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center -mt-6">
             <div className="relative w-full flex items-center justify-center mb-4">
                <Image src="/illustration.jpg" alt="Welcome" width={220} height={180} className="object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300" priority />
             </div>
             <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide px-2">HELLO {user?.name || "KARYAWAN"}!</h2>
             <p className="text-sm text-gray-500 mt-2 px-4 leading-relaxed">
               {user?.role_id !== 3 
                 ? "Good morning! You have several new applications. Let's get started managing your team."
                 : "Selamat pagi! Pastikan absensi kamu hari ini sudah tercatat. Have a great day!"}
             </p>
          </div>
          <button className="w-full max-w-[180px] bg-[#8B0000] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#660000] transition mt-4">
            Review it
          </button>
        </div>

        {/* 2. Center Panel (Stats + Line Chart) (Col 2 & 3) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[28px] font-bold text-gray-900 leading-none mb-1">{summary.present_today || 99}</div>
                <div className="text-xs font-medium text-gray-500 uppercase">Total Present</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[28px] font-bold text-gray-900 leading-none mb-1">{summary.absent_today || 15}</div>
                <div className="text-xs font-medium text-gray-500 uppercase">Total Absent</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <UserX size={20} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[28px] font-bold text-gray-900 leading-none mb-1">{summary.leave_today || '06'}</div>
                <div className="text-xs font-medium text-gray-500 uppercase">Total On Leave</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex-1 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Team Performance</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Designer Team
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                   <span className="w-2 h-2 rounded-full bg-[#8B0000]"></span> Developer Team
                </div>
                <select className="text-xs border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 font-medium cursor-pointer">
                  <option>Last year</option>
                  <option>This year</option>
                </select>
              </div>
            </div>
            
            <div className="w-full flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    dy={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="design" 
                    stroke="#9ca3af" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#9ca3af', stroke: '#fff', strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="developer" 
                    stroke="#8B0000" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#8B0000', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. Donut Chart (Col 4) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-sm">
           <h3 className="font-bold text-gray-900 mb-6">Total Employee</h3>
           <div className="h-[200px] w-full relative mb-6">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={donutData}
                   innerRadius={65}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {donutData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           
           <div className="flex flex-col gap-3 mt-auto">
             {donutData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }}></span>
                   <span className="font-medium text-gray-600">{item.name}</span>
                 </div>
                 <span className="font-bold text-gray-800">{item.value}</span>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* BOTTOM ROW GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Table Employee Status */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Employee Status</h3>
            <div className="flex gap-3">
               <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50">
                 <Filter size={14} /> Sort & Filter
               </button>
               <div className="relative">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search..."
                   className="pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#8B0000] w-[140px]"
                 />
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-xs font-bold text-gray-900 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 h-3 w-3 accent-[#8B0000]"/></th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">ID &darr;</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">Name &darr;</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">Job role</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">TL</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-900">View</th>
                </tr>
              </thead>
              <tbody>
                {employeeStatus.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 text-center"><input type="checkbox" className="rounded border-gray-300 h-3 w-3 accent-[#8B0000]"/></td>
                    <td className="py-3.5 px-4 text-xs font-bold text-[#8B0000]">{emp.id}</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-gray-900">{emp.name}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">{emp.role}</td>
                    <td className="py-3.5 px-4">
                      {emp.status === 'Active' ? (
                        <span className="bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{emp.status}</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{emp.status}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 font-medium">{emp.tl}</td>
                    <td className="py-3.5 px-4 text-gray-400">
                      <button onClick={() => setViewEmployeeId(emp.id)} className="hover:text-[#8B0000] transition">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events & Meetings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Events and Meetings</h3>
            <button className="flex items-center gap-1 bg-[#fee2e2] text-[#b91c1c] px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#fecaca] transition">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
             {upcomingEvents.map((evt, i) => (
               <div key={i} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                   <CalendarIcon size={16} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-xs font-bold text-gray-900 truncate">{evt.title}</h4>
                   <p className="text-[11px] text-gray-500 mt-0.5">{evt.sub}</p>
                 </div>
                 <div className="text-right shrink-0">
                   <p className="text-xs font-bold text-gray-900">{evt.time}</p>
                   <p className="text-[10px] text-gray-500 mt-0.5">{evt.date}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Birthdays */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Birthdays</h3>
            <select className="text-xs border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 font-medium cursor-pointer">
              <option>This month</option>
              <option>Next month</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
            {birthdays.map((bday, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center shrink-0">
                  {/* Dummy avatar replacing 404 image */}
                  <span className="font-bold text-sm">{bday.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="text-xs font-bold text-gray-900 truncate">{bday.name}</h4>
                   <p className="text-[11px] text-gray-500 mt-0.5 truncate">{bday.role}</p>
                </div>
                <div className="text-[11px] font-bold text-gray-600 shrink-0 bg-gray-100 px-2 py-1 rounded">
                  {bday.date}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Employee Quick View Modal */}
      {viewEmployeeId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          {employeeStatus.filter(e => e.id === viewEmployeeId).map(selected => (
            <div key={selected.id} className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-gray-900">Quick View Profile</h3>
                <button onClick={() => setViewEmployeeId(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#fef2f2] text-[#8B0000] flex items-center justify-center text-2xl font-bold shadow-inner">
                   {selected.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{selected.name}</h4>
                  <p className="text-sm text-gray-500 font-medium">{selected.role}</p>
                  <div className="mt-1.5 border-t border-gray-50 pt-1.5">
                    {selected.status === 'Active' ? (
                      <span className="bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{selected.status}</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{selected.status}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Employee ID</span>
                  <span className="font-bold text-[#8B0000]">{selected.id}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Team Leader</span>
                  <span className="font-bold text-gray-900">{selected.tl}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Department</span>
                  <span className="font-bold text-gray-900">Product & Eng</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setViewEmployeeId(null)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl text-sm transition shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
