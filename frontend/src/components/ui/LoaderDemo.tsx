"use client";

import React, { useState } from "react";
import Loader, { FullScreenLoader, InlineLoader, ButtonLoader } from "./Loader";

const LoaderDemo: React.FC = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-[#2B1508] mb-6">Loader Components</h1>

      {/* Basic Loaders */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Basic Loaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spinner Variants */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#2B1508]">Spinner Variants</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">SM:</span>
                <Loader size="sm" variant="spinner" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">MD:</span>
                <Loader size="md" variant="spinner" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">LG:</span>
                <Loader size="lg" variant="spinner" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">XL:</span>
                <Loader size="xl" variant="spinner" />
              </div>
            </div>
          </div>

          {/* Dots Variants */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#2B1508]">Dots Variants</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">SM:</span>
                <Loader size="sm" variant="dots" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">MD:</span>
                <Loader size="md" variant="dots" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">LG:</span>
                <Loader size="lg" variant="dots" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">XL:</span>
                <Loader size="xl" variant="dots" />
              </div>
            </div>
          </div>

          {/* Pulse Variants */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#2B1508]">Pulse Variants</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">SM:</span>
                <Loader size="sm" variant="pulse" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">MD:</span>
                <Loader size="md" variant="pulse" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">LG:</span>
                <Loader size="lg" variant="pulse" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">XL:</span>
                <Loader size="xl" variant="pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loaders with Text */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Loaders with Text</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Loader
            size="md"
            variant="spinner"
            text="Loading courses..."
            showText={true}
          />
          <Loader
            size="lg"
            variant="dots"
            text="Processing payment..."
            showText={true}
          />
          <Loader
            size="xl"
            variant="pulse"
            text="Uploading files..."
            showText={true}
          />
        </div>
      </section>

      {/* Inline Loaders */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Inline Loaders</h2>
        <div className="space-y-3">
          <p className="text-[#2B1508]">
            Loading your profile <InlineLoader size="sm" variant="dots" />
          </p>
          <p className="text-[#2B1508]">
            Fetching data <InlineLoader size="md" variant="spinner" />
          </p>
          <p className="text-[#2B1508]">
            Saving changes <InlineLoader size="lg" variant="pulse" />
          </p>
        </div>
      </section>

      {/* Button Loaders */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Button Loaders</h2>
        <div className="flex gap-4">
          <button className="bg-[#F77124] text-white px-4 py-2 rounded-2xl shadow-[0_0_2px_3px_rgba(247,173,36,1)]">
            <ButtonLoader size="sm" />
          </button>
          <button className="bg-[#F77124] text-white px-6 py-3 rounded-2xl shadow-[0_0_2px_3px_rgba(247,173,36,1)]">
            <ButtonLoader size="md" />
          </button>
        </div>
      </section>

      {/* Full Screen Loader */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Full Screen Loader</h2>
        <button
          onClick={() => setShowFullScreen(true)}
          className="bg-[#F77124] text-white px-4 py-2 rounded-2xl shadow-[0_0_2px_3px_rgba(247,173,36,1)]"
        >
          Show Full Screen Loader
        </button>
        {showFullScreen && (
          <FullScreenLoader
            text="Loading your dashboard..."
            variant="spinner"
            size="lg"
          />
        )}
      </section>

      {/* Custom Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B1508]">Custom Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Loading */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-medium text-[#2B1508] mb-3">Course Loading</h3>
            <Loader
              size="lg"
              variant="spinner"
              text="Loading course content..."
              showText={true}
              className="text-center"
            />
          </div>

          {/* Payment Processing */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-medium text-[#2B1508] mb-3">Payment Processing</h3>
            <Loader
              size="lg"
              variant="dots"
              text="Processing your payment..."
              showText={true}
              className="text-center"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoaderDemo;
