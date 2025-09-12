"use client";

import { useState, useEffect } from "react";

type FormData = {
  type: string;
  length: string;
  width: string;
  height: string;
  boundary: string;
};

const DEFAULT_FORM: FormData = {
  type: "",
  length: "",
  width: "",
  height: "",
  boundary: "",
};

const STORAGE_KEY = "proposed-structure-form";

export default function Home() {
  // Load initial form state from localStorage
  const [formData, setFormData] = useState<FormData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as FormData;
      } catch {}
    }
    return DEFAULT_FORM;
  });

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {}
  }, [formData]);

  // Results + validation errors
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Sanitise numeric fields: allow empty, digits, one dot, no negatives
    const isNumberField = ["length", "width", "height", "boundary"].includes(
      name
    );
    if (isNumberField) {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<FormData> = {};

    // Validation rules
    if (!formData.type) newErrors.type = "Please select a type.";
    ["length", "width", "height", "boundary"].forEach((k) => {
      const value = formData[k as keyof FormData];
      if (!(Number(value) > 0 && value !== "")) {
        newErrors[k as keyof FormData] = "Must be a positive number.";
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setResult(null);
      return;
    }

    // Wire to assess here
    setResult("LIKELY EXEMPT");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans p-8">
      <h1 className="text-3xl font-extrabold mb-8">Proposed Structure</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md"
        noValidate
      >
        {/* Type */}
        <div className="flex flex-col group relative">
          <label htmlFor="type" className="font-semibold mb-1">
            Type (Shed / Patio)
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            aria-invalid={!!errors.type}
            aria-describedby={errors.type ? "error-type" : undefined}
            required
            className="p-3 rounded bg-[#de814c] focus:outline-none"
          >
            <option value="">Select type</option>
            <option value="Shed">Shed</option>
            <option value="Patio">Patio</option>
          </select>
          {errors.type && (
            <span id="error-type" className="text-red-600 text-sm mt-1">
              {errors.type}
            </span>
          )}
        </div>

        {/* Length */}
        <div className="flex flex-col group relative">
          <label htmlFor="length" className="font-semibold mb-1">
            Length (m)
          </label>
          <input
            id="length"
            type="number"
            name="length"
            value={formData.length}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
            aria-invalid={!!errors.length}
            aria-describedby={errors.length ? "error-length" : undefined}
            className="p-3 rounded bg-[#de814c] focus:outline-none"
          />
          {errors.length && (
            <span id="error-length" className="text-red-600 text-sm mt-1">
              {errors.length}
            </span>
          )}
        </div>

        {/* Width */}
        <div className="flex flex-col group relative">
          <label htmlFor="width" className="font-semibold mb-1">
            Width (m)
          </label>
          <input
            id="width"
            type="number"
            name="width"
            value={formData.width}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
            aria-invalid={!!errors.width}
            aria-describedby={errors.width ? "error-width" : undefined}
            className="p-3 rounded bg-[#de814c] focus:outline-none"
          />
          {errors.width && (
            <span id="error-width" className="text-red-600 text-sm mt-1">
              {errors.width}
            </span>
          )}
        </div>

        {/* Height */}
        <div className="flex flex-col group relative">
          <label htmlFor="height" className="font-semibold mb-1">
            Height (m)
          </label>
          <input
            id="height"
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
            aria-invalid={!!errors.height}
            aria-describedby={errors.height ? "error-height" : undefined}
            className="p-3 rounded bg-[#de814c] focus:outline-none"
          />
          {errors.height && (
            <span id="error-height" className="text-red-600 text-sm mt-1">
              {errors.height}
            </span>
          )}
        </div>

        {/* Boundary */}
        <div className="flex flex-col group relative">
          <label htmlFor="boundary" className="font-semibold mb-1">
            Nearest boundary distance (m)
          </label>
          <input
            id="boundary"
            type="number"
            name="boundary"
            value={formData.boundary}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
            aria-invalid={!!errors.boundary}
            aria-describedby={errors.boundary ? "error-boundary" : undefined}
            className="p-3 rounded bg-[#de814c] focus:outline-none"
          />
          <p className="text-sm text-black/70 mt-1">
            Values must be &gt; 0. Units are metres
          </p>
          {errors.boundary && (
            <span id="error-boundary" className="text-red-600 text-sm mt-1">
              {errors.boundary}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="reset"
            onClick={() => {
              setFormData(DEFAULT_FORM);
              setErrors({});
              setResult(null);
            }}
            className="px-6 py-2 rounded bg-[#f2e1d9] text-black font-semibold"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-[#924a1d] text-white font-semibold"
          >
            Calculate
          </button>
        </div>
      </form>

      {/* Results Section */}
      {result && (
        <div
          className="mt-8 p-4 rounded bg-[#f2e1d9] text-black w-full max-w-md"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-xl font-bold mb-2">Result</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
