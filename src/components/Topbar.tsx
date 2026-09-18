import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 flex items-center justify-between gap-4 px-6 bg-white border-b border-gray-200">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Personel veya nöbet ara..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-semibold">
            AY
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900">Dr. Ayşe Yılmaz</p>
            <p className="text-xs text-gray-400">Başhekim</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
