import { useEffect, useState } from 'react';
import { CalendarDays, Users, CircleCheck as CheckCircle2, Clock, ShieldCheck, Sparkles, RefreshCw, CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useActiveRotation, type ActiveRotation } from '@/hooks/useActiveRotation';

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${TR_DAYS[d.getDay()]}`;
}

export default function Dashboard() {
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [totalGroups, setTotalGroups] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

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
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
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

  // Sort rotations by next_cycle_date ascending — nearest date first (leftmost)
  const sortedRotations = [...rotations].sort((a, b) =>
    a.taskList.next_cycle_date.localeCompare(b.taskList.next_cycle_date)
  );

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
              En yakın nöbet tarihi en solda, sonrakiler sağa doğru sıralanır.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            {sortedRotations.length} Aktif Sıra
          </span>
        </div>

        {rotationLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Aktif nöbet sıraları yükleniyor...
          </div>
        ) : sortedRotations.length === 0 ? (
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
          /* Rotation Kartları — nearest date on the far left */
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2">
            {sortedRotations.map((rotation) => {
              const isAdvancing = advancingId === rotation.taskList.id;
              const dateStr = formatLongDate(rotation.taskList.next_cycle_date);

              return (
                <div
                  key={rotation.taskList.id}
                  className="flex-1 min-w-[280px] bg-white rounded-2xl p-6 border border-slate-200 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden"
                  style={{ borderLeftWidth: '6px', borderLeftColor: rotation.group.color }}
                >
                  <div className="space-y-4">
                    {/* Grup adı — küçük, sade */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: rotation.group.color }}
                      />
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {rotation.group.name}
                      </p>
                    </div>

                    {/* Görev adı — büyük, belirgin + liste rengi rozeti */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: rotation.taskList.color }}
                      />
                      <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
                        {rotation.taskList.name}
                      </h3>
                    </div>

                    {/* Önerilen Tarih — vurgulu */}
                    <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-3">
                      <CalendarClock className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                          Önerilen Tarih
                        </p>
                        <p className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                          {dateStr}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teslim Et Aksiyonu */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
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
                          Nöbetimi Tamamladım
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
