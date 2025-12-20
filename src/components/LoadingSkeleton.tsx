export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="bg-gray-300 rounded-lg w-14 h-14"></div>
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-200 rounded-2xl h-40"></div>
        <div className="bg-gray-200 rounded-2xl h-40"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-200 rounded-xl h-32"></div>
        <div className="bg-gray-200 rounded-xl h-32"></div>
        <div className="bg-gray-200 rounded-xl h-32"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="h-6 bg-gray-300 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-20 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-24 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main Loading Message */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Data...</h3>
        <p className="text-sm text-gray-600">Mohon tunggu sebentar, kami sedang menyiapkan dashboard Anda</p>
      </div>

      {/* Balance Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        <div className="bg-gradient-to-br from-purple-200 to-purple-300 rounded-2xl h-48"></div>
        <div className="bg-gradient-to-br from-amber-200 to-amber-300 rounded-2xl h-48"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="bg-gray-200 rounded-xl h-40"></div>
        <div className="bg-gray-200 rounded-xl h-40"></div>
        <div className="bg-gray-200 rounded-xl h-40"></div>
      </div>
    </div>
  );
}
