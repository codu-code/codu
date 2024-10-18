import Link from "next/link";

const CoduChallenge = () => {
  return (
    <div className="mb-8 mt-2 overflow-hidden rounded border border-neutral-300 bg-gradient-to-br from-blue-600 to-pink-600 text-white shadow-lg dark:border-neutral-600">
      <div className="p-6">
        <h3 className="mb-2 text-2xl font-bold">Ready for a challenge?</h3>
        <p className="mb-4 text-lg">
          Write 6 articles in 6 weeks, showcase your expertise, and win
          exclusive Codú swag!
        </p>
        <Link
          href="/articles/join-our-6-week-writing-challenge-quohtgqb"
          className="flex items-center justify-center rounded bg-white px-6 py-2 text-sm font-semibold text-pink-600 transition-colors hover:bg-pink-100"
        >
          Find out more
        </Link>
      </div>
    </div>
  );
};

export default CoduChallenge;
