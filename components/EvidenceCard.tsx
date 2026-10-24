import Image from "next/image";

export default function EvidenceCard() {
  return (
    <Image
      src="/doorstamp-evidence-card.png"
      alt="A kitchen move-out photo with a scuff circled, its upload time, fingerprint, and a locked status"
      width={1200}
      height={1000}
      priority
      className="mx-auto h-auto w-full max-w-md"
    />
  );
}