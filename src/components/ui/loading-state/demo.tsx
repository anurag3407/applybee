import LoadingState from "./index";

export default function LoadingStateDemo() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-6">
        <LoadingState variant="Drive" label="Verifying contact email" />
        <LoadingState variant="Dots" label="Scanning career profile" />
        <LoadingState variant="Orbit" label="Drafting tailored introduction" />
      </div>
    </div>
  );
}
