"use client";

import React, { createContext, useContext } from "react";
import { FormProvider } from "react-hook-form";
import {
  UseInternshipFormOptions,
  UseInternshipFormReturn,
} from "@/types/internshipForm";
import { useInternshipForm } from "@/hooks/useInternshipForm";

const InternshipFormContext = createContext<UseInternshipFormReturn | null>(
  null,
);

export const useInternshipFormContext = (): UseInternshipFormReturn => {
  const context = useContext(InternshipFormContext);
  if (!context) {
    throw new Error(
      "useInternshipFormContext must be used within InternshipFormProvider",
    );
  }
  return context;
};

interface InternshipFormProviderProps {
  children: React.ReactNode;
  options?: UseInternshipFormOptions;
}

export const InternshipFormProvider: React.FC<InternshipFormProviderProps> = ({
  children,
  options = {},
}) => {
  const internshipForm = useInternshipForm(options);

  return (
    <InternshipFormContext.Provider value={internshipForm}>
      <FormProvider {...(internshipForm as any)}>{children}</FormProvider>
    </InternshipFormContext.Provider>
  );
};
