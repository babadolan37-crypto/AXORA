import { Shield } from 'lucide-react';
import { DEFAULT_ROLE_PERMISSIONS } from '../types/user-roles';

export function RolesSheet() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl text-gray-900">User Roles & Permissions</h2>
        <p className="text-sm text-gray-600 mt-1">Kelola akses dan permission user</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_ROLE_PERMISSIONS.map((roleData) => (
          <div key={roleData.role} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Shield size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg text-gray-900 capitalize">{roleData.role}</h3>
                <p className="text-xs text-gray-600">{roleData.description}</p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {roleData.permissions.slice(0, 3).map((perm) => (
                <div key={perm.resource} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 capitalize">{perm.resource}</span>
                  <div className="flex gap-1">
                    {perm.actions.map((action) => (
                      <span
                        key={action}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {roleData.permissions.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{roleData.permissions.length - 3} permissions lainnya
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Coming Soon:</strong> Assign roles ke user, custom permissions, activity log per user
        </p>
      </div>
    </div>
  );
}
