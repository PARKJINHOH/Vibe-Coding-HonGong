interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total === 0 ? 0 : (current / total) * 100;
  return (
    <div className="w-full bg-white/30 rounded-full h-2">
      <div
        className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
