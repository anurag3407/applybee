"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowUpRight, Star } from "lucide-react";

export type AvatarList = {
  image: string;
};

export type HeroSectionProps = {
  avatarList: AvatarList[];
  trial?: { contact: number; ai: number } | null;
};

export function HeroSection({ avatarList, trial }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="w-full h-full relative">
        <div className="relative w-full pt-8 md:pt-20 pb-8 md:pb-14 before:absolute before:w-full before:h-full before:bg-gradient-to-r before:from-sky-100/70 before:via-white before:to-amber-100/70 before:rounded-full before:top-20 before:blur-3xl before:-z-10 dark:before:from-slate-900/60 dark:before:via-background dark:before:to-stone-900/60 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="lg:text-7xl md:text-6xl text-4xl font-bold leading-tight md:leading-tight lg:leading-[1.1] tracking-tight text-foreground max-w-4xl"
                >
                  The career outreach workspace where you stay in{" "}
                  <span className="font-editorial italic font-normal text-honey-deep dark:text-honey tracking-tight">
                    control of every draft
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeInOut" }}
                  className="text-base sm:text-lg font-normal max-w-2xl text-muted-foreground"
                >
                  Bypass saturated applicant portals. Ground your proven technical achievements into bespoke introductions staged directly in your personal Gmail drafts.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
                className="flex items-center flex-col md:flex-row justify-center gap-8"
              >
                <Link href="/sign-up">
                  <Button className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer bg-primary text-primary-foreground shadow-md hover:shadow-lg">
                    <span className="relative z-10 transition-all duration-500">
                      Start Free
                    </span>
                    <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </span>
                  </Button>
                </Link>
                <div className="flex items-center sm:gap-7 gap-3">
                  <ul className="avatar flex flex-row items-center">
                    {avatarList.map((avatar, index) => (
                      <li key={index} className="-mr-2.5 z-1 transition-transform hover:scale-110">
                        <img
                          src={avatar.image}
                          alt="Verified Professional"
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-background w-10 h-10 object-cover shadow-xs"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="gap-1 flex flex-col items-start">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                      Trusted by 1,000+ candidates & engineers
                    </p>
                  </div>
                </div>
              </motion.div>
              {trial ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex justify-center"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {trial.contact} contact reveals · {trial.ai} AI generations · No card required
                  </p>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
