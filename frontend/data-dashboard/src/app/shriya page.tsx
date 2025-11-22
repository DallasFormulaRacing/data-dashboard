"use client";

import React from "react";
import Hero from "./components/home/Hero";
import AboutUs from "./components/home/AboutUs";
import { OrgInfo } from "./components/home/OrgInfo";
import MeetingTimes from "./components/home/MeetingTimes";
import Sponsors from "./sponsors/SponsorComponent";
import TireDegradation from "@/components/ui/TireDegradation";
import LiveDataGraphs from "@/components/ui/LiveDataGraphs";
import Image from "next/image";

// Example car prototypes with progress percentages
const CAR_PROTOTYPES = [
  {
    src: "/assets/Cars/2022Car.jpg",
    alt: "2022 Competition Car",
    name: "2022 Car",
    completion: 100,
  },
  {
    src: "/assets/car_gallery/2023Car.jpeg",
    alt: "2023 Competition Car",
    name: "2023 Car",
    completion: 85,
  },
  {
    src: "/assets/Cars/2024/2024_3.png",
    alt: "2024 Competition Car",
    name: "2024 Car",
    completion: 60,
  },
];

export default function Home() {
  return (
    <main className="px-0 leading-7 bg-black text-white">
      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <AboutUs />
      <OrgInfo />

      {/* Car Prototypes / Carousel Section */}
      <section className="py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-center">Car Prototypes</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {CAR_PROTOTYPES.map((car) => (
            <div
              key={car.name}
              className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg"
              style={{ width: 280 }}
            >
              <Image
                src={car.src}
                alt={car.alt}
                width={280}
                height={180}
                className="object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-lg">{car.name}</h3>
                <div className="w-full bg-gray-700 rounded-full h-4 mt-1">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: `${car.completion}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{car.completion}% complete</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tire Degradation Graph */}
      <section className="py-8 px-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">Tire Degradation</h2>
        <TireDegradation applyExponential={true} normalize={true} />
      </section>

      {/* Live Telemetry Graphs */}
      <section className="py-8 px-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">Live Car Telemetry</h2>
        <LiveDataGraphs />
      </section>

      {/* Meeting Times Section */}
      <section className="py-8 px-4">
        <MeetingTimes />
      </section>

      {/* Sponsors Section */}
      <section className="py-8 px-4">
        <Sponsors />
      </section>
    </main>
  );
}
