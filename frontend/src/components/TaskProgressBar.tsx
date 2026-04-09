import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

type ProgressBarProps = {
  progress: number;
  totalActivities: number;
  completedActivities: number;
};

export default function TaskProgressBar({ progress, totalActivities, completedActivities }: ProgressBarProps) {
  const getStatusColor = () => {
    if (progress === 100) return "bg-emerald-500";
    if (progress > 0) return "bg-blue-500";
    return "bg-gray-300";
  };

  const getStatusIcon = () => {
    if (progress === 100) {
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    }
    if (progress > 0) {
      return <Clock size={16} className="text-blue-600" />;
    }
    return <Circle size={16} className="text-gray-400" />;
  };

  return (
    <div className="space-y-2">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-semibold text-gray-700">Progress</span>
        </div>
        <span className="text-sm font-bold text-gray-900">{progress.toFixed(0)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Details */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{completedActivities} dari {totalActivities} kegiatan selesai</span>
        {progress === 100 && (
          <span className="text-emerald-600 font-semibold">✓ Selesai</span>
        )}
      </div>
    </div>
  );
}
