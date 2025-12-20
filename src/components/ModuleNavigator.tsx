import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  FileText,
  CheckSquare,
  Calculator,
  Users,
  History,
  Bell,
  Building2,
  RefreshCcw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  Box,
} from 'lucide-react';

export type ModuleType =
  | 'dashboard'
  | 'transaction'
  | 'budget'
  | 'invoice'
  | 'approval'
  | 'roles'
  | 'audit'
  | 'notifications'
  | 'bank-recon'
  | 'recurring'
  | 'debt'
  | 'financial-reports'
  | 'fixed-assets'
  | 'advance'
  | 'admin'
  | 'settings';

interface ModuleNavigatorProps {
  activeModule: ModuleType;
  onChange: (module: ModuleType) => void;
}

const MODULES = [
  {
    id: 'dashboard' as ModuleType,
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: null,
    category: 'Main',
  },
  {
    id: 'transaction' as ModuleType,
    label: 'Kas & Transaksi',
    icon: Receipt,
    badge: null,
    category: 'Main',
  },
  {
    id: 'debt' as ModuleType,
    label: 'Hutang & Piutang',
    icon: Users,
    badge: null,
    category: 'Financial',
  },
  {
    id: 'financial-reports' as ModuleType,
    label: 'Laporan Keuangan',
    icon: FileText,
    badge: null,
    category: 'Financial',
  },
  {
    id: 'fixed-assets' as ModuleType,
    label: 'Aset Tetap',
    icon: Box,
    badge: null,
    category: 'Financial',
  },
  {
    id: 'advance' as ModuleType,
    label: 'Pengembalian Dana',
    icon: RefreshCcw,
    badge: null,
    category: 'Main',
  },
  {
    id: 'budget' as ModuleType,
    label: 'Budget & Planning',
    icon: Calculator,
    badge: null,
    category: 'Finance',
  },
  {
    id: 'invoice' as ModuleType,
    label: 'Invoice',
    icon: FileText,
    badge: null,
    category: 'Financial',
  },
  {
    id: 'recurring' as ModuleType,
    label: 'Transaksi Berulang',
    icon: RefreshCcw,
    badge: null,
    category: 'Financial',
  },
  {
    id: 'admin' as ModuleType,
    label: 'Admin & Security',
    icon: Shield,
    badge: null,
    category: 'System',
  },
  {
    id: 'approval' as ModuleType,
    label: 'Persetujuan',
    icon: CheckSquare,
    badge: null,
    category: 'Management',
  },
  {
    id: 'bank-recon' as ModuleType,
    label: 'Rekonsiliasi Bank',
    icon: Building2,
    badge: null,
    category: 'Management',
  },
  {
    id: 'settings' as ModuleType,
    label: 'Pengaturan',
    icon: Settings,
    badge: null,
    category: 'System',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  'Main': '📊 Utama',
  'Financial': '💰 Keuangan',
  'Management': '⚙️ Manajemen',
  'System': '🔧 Sistem',
};

export function ModuleNavigator({ activeModule, onChange }: ModuleNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved ? JSON.parse(saved) : true;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleModuleClick = (moduleId: ModuleType) => {
    onChange(moduleId);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const categories = ['Main', 'Financial', 'Management', 'System'];

  // Mobile: Horizontal bar at top with hamburger
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              {MODULES.find(m => m.id === activeModule)?.icon && (
                <>
                  {(() => {
                    const Icon = MODULES.find(m => m.id === activeModule)!.icon!;
                    return <Icon size={20} className="text-blue-600" />;
                  })()}
                </>
              )}
              <span className="font-medium text-gray-900">
                {MODULES.find(m => m.id === activeModule)?.label}
              </span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Menu Navigasi</h2>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-73px)] pb-6">
            {categories.map((category) => {
              const categoryModules = MODULES.filter((m) => m.category === category);
              if (categoryModules.length === 0) return null;

              return (
                <div key={category} className="px-3 py-4 border-b border-gray-100">
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-1">
                    {categoryModules.map((module) => {
                      const Icon = module.icon;
                      const isActive = activeModule === module.id;

                      return (
                        <button
                          key={module.id}
                          onClick={() => handleModuleClick(module.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {Icon && <Icon size={20} />}
                          <span className="text-sm font-medium">{module.label}</span>
                          {module.badge && (
                            <span
                              className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                              }`}
                            >
                              {module.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Sidebar (Collapsible)
  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-30 print:hidden ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isExpanded && (
            <h2 className="font-semibold text-gray-900">Menu</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
            title={isExpanded ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {isExpanded ? (
              <ChevronLeft size={20} className="text-gray-600" />
            ) : (
              <ChevronRight size={20} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="overflow-y-auto h-[calc(100vh-73px)] pb-6">
          {categories.map((category) => {
            const categoryModules = MODULES.filter((m) => m.category === category);
            if (categoryModules.length === 0) return null;

            return (
              <div key={category} className="py-3 border-b border-gray-100">
                {isExpanded && (
                  <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </h3>
                )}
                <div className="space-y-1 px-2">
                  {categoryModules.map((module) => {
                    const Icon = module.icon;
                    const isActive = activeModule === module.id;

                    return (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${!isExpanded ? 'justify-center' : ''}`}
                        title={!isExpanded ? module.label : ''}
                      >
                        {Icon && <Icon size={20} />}
                        {isExpanded && (
                          <>
                            <span className="text-sm font-medium flex-1 text-left">
                              {module.label}
                            </span>
                            {module.badge && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                {module.badge}
                              </span>
                            )}
                          </>
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {!isExpanded && (
                          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {module.label}
                            {module.badge && (
                              <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                {module.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer to prevent content from going under sidebar */}
      <div className={`${isExpanded ? 'w-64' : 'w-20'} flex-shrink-0 transition-all duration-300`} />
    </>
  );
}