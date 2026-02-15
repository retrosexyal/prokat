type Props = {
  available: boolean;
};

export function RentButton({ available }: Props) {
  return (
    <button
      disabled={!available}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        available
          ? "bg-yellow-400 hover:bg-yellow-500 text-black"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }`}
    >
      Арендовать
    </button>
  );
}
