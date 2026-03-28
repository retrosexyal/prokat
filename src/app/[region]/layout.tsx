import { LayoutHeader } from "@/components/LayoutHeader";

type Props = {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
};

export default async function RegionLayout({ children, params }: Props) {
  const { region } = await params;

  return (
    <>
      <LayoutHeader forcedRegion={region} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}