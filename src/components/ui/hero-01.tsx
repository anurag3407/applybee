import HeroSection from "@/components/ui/hero-01-utils/hero";
import type { NavigationSection } from "@/components/ui/hero-01-utils/header";
import Header from "@/components/ui/hero-01-utils/header";
import BrandSlider, {
  BrandList,
} from "@/components/ui/hero-01-utils/brand-slider";
import type { AvatarList } from "@/components/ui/hero-01-utils/hero";

export const defaultAvatarList: AvatarList[] = [
  {
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
  },
];

export const defaultNavigationData: NavigationSection[] = [
  {
    title: "Overview",
    href: "#",
    isActive: true,
  },
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "How It Works",
    href: "#how-it-works",
  },
  {
    title: "Directory",
    href: "#directory",
  },
  {
    title: "Pricing",
    href: "#pricing",
  },
  {
    title: "FAQ",
    href: "#faq",
  },
];

export const defaultBrandList: BrandList[] = [
  {
    image:
      "https://cdn.21st.dev/assets/localized/d824c259df6b2b2962fbef96e68a6877cab689b19246e3dc34ac9e7b144d32bd.svg",
    lightimg:
      "https://cdn.21st.dev/assets/localized/15cd724e2a038ed1415820ee25349eac7dfadec7f9359ae3800c13856ecb8b13.svg",
    name: "Brand 1",
  },
  {
    image:
      "https://cdn.21st.dev/assets/localized/266083df0c7d0633f145889af4700d18e62b8f2c068fd8ab73d5a94b87a5a5cb.svg",
    lightimg:
      "https://cdn.21st.dev/assets/localized/ae83ac635485a392bac5c1723e98d6820d3587f762fdbde63cd462d7edea7c0d.svg",
    name: "Brand 2",
  },
  {
    image:
      "https://cdn.21st.dev/assets/localized/91d1c562d12ba69aa7525d3782c6c6223b90e302073d59769dfce665ab9a83b7.svg",
    lightimg:
      "https://cdn.21st.dev/assets/localized/23d52f6aa5bbc765b65d5253b6578ed0e9213956a21be149f679cc79e2b0259e.svg",
    name: "Brand 3",
  },
  {
    image:
      "https://cdn.21st.dev/assets/localized/f50b06ae2b7bf86d199b0ac986a47442f4a198d2f6dd81a9fe83c43022608498.svg",
    lightimg:
      "https://cdn.21st.dev/assets/localized/4cd93b1d1133feffdf8eba4431f93c14b538120c74285f39fe7ad1c6e48f7b53.svg",
    name: "Brand 4",
  },
  {
    image:
      "https://cdn.21st.dev/assets/localized/3ad67ddda671655df765a507c9bcc7b67e4138a1ffe903ace17cef99c5c972a3.svg",
    lightimg:
      "https://cdn.21st.dev/assets/localized/6ee9f831a7c1cb87c14308a9d687fbd5fb2f319abee03d306b78730421410354.svg",
    name: "Brand 5",
  },
];

export interface AgencyHeroSectionProps {
  showHeader?: boolean;
  avatarList?: AvatarList[];
  navigationData?: NavigationSection[];
  brandList?: BrandList[];
  trial?: { contact: number; ai: number } | null;
}

export default function AgencyHeroSection({
  showHeader = true,
  avatarList = defaultAvatarList,
  navigationData = defaultNavigationData,
  brandList = defaultBrandList,
  trial,
}: AgencyHeroSectionProps = {}) {
  return (
    <div className="relative">
      {showHeader && <Header navigationData={navigationData} />}
      <main>
        <HeroSection avatarList={avatarList} trial={trial} />
        <BrandSlider brandList={brandList} />
      </main>
    </div>
  );
}

export { HeroSection, Header, BrandSlider };
export type { AvatarList, NavigationSection, BrandList };
