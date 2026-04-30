import InternshipSection from "./components/InternshipSection";
import TopInternshipSection from "./components/TopInternshipSection";

const InternshipsPage = () => {
  return (
    <div className="w-full flex flex-col gap-10 p-4 bg-[rgba(226,226,226,0.4)]">
      <TopInternshipSection />
      <InternshipSection />
    </div>
  );
};

export default InternshipsPage;
