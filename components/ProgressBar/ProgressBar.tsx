import { useNProgress } from "@tanem/react-nprogress";

interface Props {
  isAnimating: boolean;
}

const ProgressBar = ({ isAnimating }: Props) => {
  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating,
  });

  return (
    <div
      className="pointer-events-none"
      style={{
        opacity: isFinished ? 0 : 1,
        transition: `opacity ${animationDuration}ms linear`,
      }}
    >
      <div
        className="bg-gradient-to-r from-orange-400 to-pink-600 h-1 w-full left-0 top-0 fixed z-50"
        style={{
          marginLeft: `${(-1 + progress) * 100}%`,
          transition: `margin-left ${animationDuration}ms linear`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
