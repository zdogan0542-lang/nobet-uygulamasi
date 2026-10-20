import { useEffect, useState } from 'react';
import { CalendarDays, Users, CircleCheck as CheckCircle2, Clock, ChevronRight, ShieldCheck, Sparkles, RefreshCw, UserCheck, Repeat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useActiveRotation, type ActiveRotation } from '@/hooks/useActiveRotation';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

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

  const { rotations, loading: rotationLoading, advance, refetch: refetchRotation } = useActiveRotation();
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });
      setTotalStaff(staffCount || 0);

      const { count: groupCount } = await supabase
        .from('duty_groups')
        .select('*', { count: 'exact', head: true });
      setTotalGroups(groupCount || 0);

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

  async function handleHandover(rotation: ActiveRotation) {
    setAdvancingId(rotation.taskList.id);
    const result = await advance(rotation.taskList.id);
    setAdvancingId(null);
    if (result.error) {
      console.error('Nöbet devri başarısız:', result.error);
    } else {
      await refetchRotation();
    }
  }

  const activeDuties = [...duties];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Karşılama Başlığı */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
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

      {/* Aktif Grup Nöbet Sırası (Rotation) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Sırası Gelen & Aktif Nöbetler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nöbet grubu sıralamasında şu an aktif olan personeller ve dönem bilgileri.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            {rotations.length} Aktif Sıra
          </span>
        </div>

        {rotationLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Aktif nöbet sıraları yükleniyor...
          </div>
        ) : rotations.length === 0 ? (
          /* Boş Durum */
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
          /* Rotation Kartları */
          <div className="flex flex-col md:flex-row-reverse gap-4 overflow-x-auto pb-2">
            {rotations.map((rotation, index) => {
              const isFirstNearest = index === 0;
              const cycleDateStr = formatDate(rotation.taskList.next_cycle_date);
              const nextIdx = (rotation.turnPosition + 1) % rotation.turnCount;
              const isAdvancing = advancingId === rotation.taskList.id;
              const staffName = rotation.currentStaff?.full_name ?? rotation.currentTurn.label;
              const staffTitle = rotation.currentStaff?.title ?? '';

              return (
                <div
                  key={rotation.taskList.id}
                  className={`flex-1 min-w-[300px] bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isFirstNearest
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Durum Rozeti */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif Nöbet
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Repeat className="w-3 h-3" />
                        {rotation.turnPosition + 1}/{rotation.turnCount}
                      </span>
                    </div>

                    {/* Grup & Görev Bilgisi */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: rotation.group.color }}
                        />
                        <h4 className="font-bold text-slate-800 text-base leading-snug">
                          {rotation.group.name} · {rotation.taskList.name}
                        </h4>
                      </div>
                      {rotation.taskList.description && (
                        <p className="text-xs text-slate-400">{rotation.taskList.description}</p>
                      )}
                    </div>

                    {/* Aktif Personel */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {getInitials(staffName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{staffName}</p>
                        {staffTitle && (
                          <p className="text-xs text-slate-400">{staffTitle}</p>
                        )}
                      </div>
                      <UserCheck className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                    </div>

                    {/* Dönem Bilgisi */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sıradaki dönem: <span className="font-medium text-slate-700">{cycleDateStr}</span></span>
                      <span className="text-slate-300">·</span>
                      <span>{rotation.taskList.cycle_days} günlük dönem</span>
                    </div>
                  </div>

                  {/* Teslim Et Aksiyonu */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleHandover(rotation)}
                      disabled={isAdvancing}
                      className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                        isAdvancing
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200'
                      }`}
                    >
                      {isAdvancing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Teslim Ediliyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Nöbeti Tamamla / Teslim Et
                        </>
                      )}
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
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
