"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/shared/Button";
import AddressMapPicker from "@/components/shared/AddressMapPicker";
import { Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const STEPS = ["Personal Info", "Company Info", "KYC"];

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    personalEmail: "",
    phone: "",
    password: "",
    companyName: "",
    regNumber: "",
    companyAddress: "",
    companyPhone: "",
    branchLatitude: "",
    branchLongitude: "",
    cacDoc: null,
    addressDoc: null,
    adminIdDoc: null,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => ({
    companyName: form.companyName,
    phone: form.companyPhone,
    email: form.personalEmail,
    address: form.companyAddress,
    cacRegistrationNumber: form.regNumber,
    cacCertificate: { fileName: form.cacDoc?.name || "pending.pdf", fileUrl: "https://pending-upload.dlm.com/certificate.pdf" },
    primaryContact: {
      fullName: form.fullName,
      roleTitle: "Admin",
      phone: form.phone,
      email: form.personalEmail,
    },
    password: form.password,
    primaryBranch: {
      name: "Main Branch",
      address: form.companyAddress,
      geolocation: {
        latitude: parseFloat(form.branchLatitude) || 6.5244,
        longitude: parseFloat(form.branchLongitude) || 3.3792,
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/tenants/register", buildPayload());
      router.push("/company/login");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-black text-gray-900">DLM</h1>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
              <span className={`text-xs ${i + 1 <= step ? "text-gray-900 font-medium" : "text-gray-500"}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="text-gray-300 mx-1">→</span>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-gray-500">Full Name *</label>
                <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email *</label>
                <input type="email" value={form.personalEmail} onChange={(e) => update("personalEmail", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
              </div>
              <div className="relative">
                <label className="text-xs text-gray-500">Password *</label>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 pr-8" required minLength={10} />
                <button type="button" className="absolute right-2 top-[36px] text-gray-400" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs text-gray-500">Company Name *</label>
                <input type="text" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Registration Number *</label>
                <input type="text" value={form.regNumber} onChange={(e) => update("regNumber", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. RC-1234567" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Company Phone *</label>
                <input type="tel" value={form.companyPhone} onChange={(e) => update("companyPhone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Branch Address & Location *</label>
                <AddressMapPicker
                  address={form.companyAddress}
                  latitude={form.branchLatitude ? Number(form.branchLatitude) : undefined}
                  longitude={form.branchLongitude ? Number(form.branchLongitude) : undefined}
                  onChange={({ address, latitude, longitude }) => setForm((prev) => ({ ...prev, companyAddress: address, branchLatitude: String(latitude), branchLongitude: String(longitude) }))}
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Upload the following documents for KYC verification.</p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Note: Document uploads will be processed separately after registration.
              </p>
              {[
                { label: "CAC Business Registration *", key: "cacDoc" },
                { label: "Proof of Address *", key: "addressDoc" },
                { label: "Admin ID *", key: "adminIdDoc" },
              ].map((doc) => (
                <div key={doc.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{doc.label}</label>
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                    <Upload size={16} className="text-gray-400" />
                    <span className={form[doc.key] ? "text-gray-900" : "text-gray-400"}>{form[doc.key] ? form[doc.key].name : "Upload file"}</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => update(doc.key, e.target.files[0])} />
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)} disabled={loading}>Previous</Button>}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Submitting...</span>
              ) : step < 3 ? "Next" : "Submit Registration"}
            </Button>
          </div>

          {step === 3 && (
            <p className="text-xs text-center text-gray-500">Already have an account? <Link href="/company/login" className="text-primary hover:underline">Sign in</Link></p>
          )}
        </form>
      </div>
    </div>
  );
}
