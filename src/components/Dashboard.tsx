import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DutyItem {
  id: string;
  duty_date: string;
  shift_type?: string;
  status?: string;
  group_name?: string;
  staff_name?: string;
}

export default function Dashboard() {
  const [duties, setDuties] = useState<DutyItem[]>([]);
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [totalGroups, setTotalGroups] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedId, setCompletedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Personel sayısı
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });
      setTotalStaff(staffCount || 0);

      // Grup sayısı
      const { count: groupCount } = await supabase
        .from('duty_groups')
        .select('*', { count: 'exact', head: true });
      setTotalGroups(groupCount || 0);

      // Nöbetler
      const today = new Date().toISOString().split('T')[0];
      const { data: dutyData } = await supabase
        .from('duties')
        .select(`
          id,
          duty_date,
          shift_type,
          status,
          staff:staff_id (name),
          duty_groups:group_id (name)
        `)
        .gte('duty_date', today)
        .order('duty_date', { ascending: true })
        .limit(6);

      if (dutyData) {
        const mapped: DutyItem[] = dutyData.map((d: any) => ({
          id: d.id,
          duty_date: d.duty_date,
          shift_type: d.shift_type || 'Standart Nöbet',
          status: d.status || 'pending',
          staff_name: d.staff?.name || 'Atanmamış',
          group_name: d.duty_groups?.name || 'Genel Birim',
        }));
        setDuties(mapped);
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteDuty(id: string) {
    try {
      setCompletedId(id);
      await supabase
        .from('duties')
        .update({ status: 'completed' })
        .eq('id', id);

      setTimeout(() => {
        setDuties((prev) => prev.filter((item) => item.id !== id));
        setCompletedId(null);
      }, 700);
    } catch (error) {
      console.error('Görev güncellenemedi:', error);
      setCompletedId(null);
    }
  }

  // Sıralama mantığı: En yakın nöbet sağ başta, uzaklaştıkça sola doğru gidecek şekilde (flex-row-reverse ile listelenecektir)
  // Bu nedenle tarihi en yakından en uzağa sıralı listeyi tersten akıtıyoruz.
  const activeDuties = [...duties];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Karşılama Başlığı */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Hoş Geldiniz <Sparkles className="w-5 h-5 text-amber-300" />
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Nöbet akışınızı, yaklaşan sıralarınızı ve birim durumunu buradan takip edebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 self-start md:self-auto">
            <Clock className="w-5 h-5 text-blue-200" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Aktif / Sıradaki Nöbetler Akışı */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Sırası Gelen & Aktif Nöbetler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              En yakın nöbet sağ başta olacak şekilde planlanan sıradaki nöbetler listelenir.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            {activeDuties.length} Nöbet Sırada
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Nöbet bilgileri yükleniyor...
          </div>
        ) : activeDuties.length === 0 ? (
          /* Nöbet Olmadığında Görünen Boş Durum Kartı */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-700">Aktif Nöbetiniz Bulunmamakta</h3>
              <p className="text-xs text-slate-400 mt-1">
                Şu an üzerinize tanımlanmış bekleyen veya devam eden bir nöbet sırası yoktur.
              </p>
            </div>
          </div>
        ) : (
          /* Nöbet Kartları (En yakın nöbet sağ başta, uzaklaştıkça sola dizilir) */
          <div className="flex flex-col md:flex-row-reverse gap-4 overflow-x-auto pb-2">
            {activeDuties.map((item, index) => {
              const isToday = item.duty_date === todayStr;
              const isFirstNearest = index === 0;

              return (
                <div
                  key={item.id}
                  className={`flex-1 min-w-[280px] bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isFirstNearest
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Durum Rozeti */}
                    <div className="flex items-center justify-between">
                      {isToday ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif Nöbet (Bugün)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Önerilen / Planlanan
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        {item.duty_date}
                      </span>
                    </div>

                    {/* Grup & Görev Bilgisi */}
                    <div>
                      <h4 className="font-bold text-slate-800 text-base leading-snug">
                        {item.group_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.shift_type} • <span className="text-slate-700 font-medium">{item.staff_name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Hızlı Aksiyon Butonu */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleCompleteDuty(item.id)}
                      disabled={completedId === item.id}
                      className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                        completedId === item.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {completedId === item.id ? 'Tamamlandı!' : 'Nöbeti Tamamladım / Teslim Ettim'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kayıtlı Personel</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalStaff}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nöbet Grupları</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalGroups}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sistem Durumu</p>
            <h3 className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Veritabanı Aktif
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
