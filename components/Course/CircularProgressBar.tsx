export const CircularProgressBar = ({ progress }: { progress: number }) => {
  const strokeWidth = 10; // Adjust this value to change the thickness of the outline
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center justify-center overflow-hidden ">
      <svg
        className="w-32 h-32 transform translate-x-1 translate-y-1"
        aria-hidden="true"
      >
        <circle
          className="text-gray-300"
          stroke-width="10"
          stroke="currentColor"
          fill="transparent"
          r="50"
          cx="60"
          cy="60"
        />
        <circle
          className="text-pink-600"
          stroke-width="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          stroke-linecap="round"
          stroke="currentColor"
          fill="transparent"
          r="50"
          cx="60"
          cy="60"
        />
      </svg>
      <span className="absolute text-2xl">{progress}%</span>
    </div>
  );
};
