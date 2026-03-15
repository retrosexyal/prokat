type Props = {
  available: boolean;
  onClick?: () => void;
};

export function RentButton({ available, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      className="rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
    >
      Арендовать
    </button>
  );
}
