/// <reference types="vite/client" />

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  export type Icon = FC<IconProps>;
  export const FileSpreadsheet: Icon;
  export const BarChart3: Icon;
  export const Receipt: Icon;
  export const CreditCard: Icon;
  export const Settings: Icon;
  export const LogOut: Icon;
  export const ArrowLeftRight: Icon;
  export const Bell: Icon;
  export const WifiOff: Icon;
  export const LayoutDashboard: Icon;
  export const TrendingUp: Icon;
  export const FileText: Icon;
  export const CheckSquare: Icon;
  export const Calculator: Icon;
  export const Users: Icon;
  export const History: Icon;
  export const Building2: Icon;
  export const RefreshCcw: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Menu: Icon;
  export const X: Icon;
  export const Shield: Icon;
  export const Box: Icon;
  export const Activity: Icon;
  export const RefreshCw: Icon;
  export const Download: Icon;
  export const Upload: Icon;
  export const Plus: Icon;
  export const Trash2: Icon;
  export const Edit: Icon;
  export const Save: Icon;
  export const Search: Icon;
  export const Filter: Icon;
  export const Calendar: Icon;
  export const Clock: Icon;
  export const Mail: Icon;
  export const Phone: Icon;
  export const MapPin: Icon;
  export const Link: Icon;
  export const ExternalLink: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const Info: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const XCircle: Icon;
  export const MoreVertical: Icon;
  export const MoreHorizontal: Icon;
  export const Loader2: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ArrowRight: Icon;
  export const ArrowLeft: Icon;
  export const ArrowUp: Icon;
  export const ArrowDown: Icon;
  // Add other icons as needed, or use a wildcard export if possible (not ideal for type safety but good for build fix)
  // Fallback for any other icon
  export const icons: Record<string, Icon>;
}
