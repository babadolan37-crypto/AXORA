import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationSheet() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-gray-900">Notifikasi</h2>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <CheckCheck size={18} />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white border rounded-lg p-4 transition-colors ${
                notif.read ? 'border-gray-200' : 'border-blue-300 bg-blue-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(
                        notif.priority
                      )}`}
                    >
                      {notif.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notif.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <h3 className="text-sm text-gray-900 mb-1">{notif.title}</h3>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
                <div className="flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="Tandai dibaca"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
