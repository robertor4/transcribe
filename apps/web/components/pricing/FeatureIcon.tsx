import { LucideIcon } from 'lucide-react';

interface FeatureIconProps {
  icon: LucideIcon;
  color?: string;
}

export function FeatureIcon({ icon: Icon, color = 'text-[#cc3399]' }: FeatureIconProps) {
  return (
    <div className={`flex-shrink-0 ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
