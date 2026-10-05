"use client";

import * as React from "react";
import { Marquee } from "@/components/ui/hero-01-utils/marquee";
import { motion } from "motion/react";

export interface BrandList {
  image: string;
  name: string;
  lightimg: string;
}

export function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  return (
    <section className="py-6 md:py-10 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="flex flex-col gap-4"
        >
          <div className="flex justify-center text-center py-2 relative">
            <div className="flex items-center justify-center gap-4">
              <div className="hidden md:block h-px w-36 bg-gradient-to-r from-transparent to-border" />
              <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground text-center">
                Trusted by engineering leaders & candidates targeting top teams
              </p>
              <div className="hidden md:block h-px w-36 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
          {brandList && brandList.length > 0 && (
            <div className="py-4">
              <Marquee pauseOnHover className="[--duration:28s] p-0">
                {brandList.map((brand, index) => (
                  <div key={index} className="flex items-center justify-center px-4">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="h-7 w-auto max-w-[120px] object-contain opacity-70 hover:opacity-100 transition-opacity dark:hidden"
                      loading="lazy"
                    />
                    <img
                      src={brand.lightimg}
                      alt={brand.name}
                      className="hidden dark:block h-7 w-auto max-w-[120px] object-contain opacity-70 hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                ))}
              </Marquee>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default BrandSlider;
