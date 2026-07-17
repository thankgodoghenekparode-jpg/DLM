"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Building2, Users, CreditCard, PartyPopper, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const STEPS = [
  { title: "Welcome", icon: PartyPopper },
  { title: "Company Profile", icon: Building2 },
  { title: "Add Team", icon: Users },
  { title: "Choose Plan", icon: CreditCard },
];

const INVITE_ROLES = ["COMPANY_ADMIN", "DISPATCH_MANAGER", "BRANCH_ADMIN"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [invites, setInvites] = useState([{ fullName: "", email: "", phone: "", role: "DISPATCH_MANAGER" }]);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState([]);
  const [skipLoading, setSkipLoading] = useState(false);

  useEffect(() => {
    if (step === 4 && plans.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlansError(null);
      api.get("/platform/subscription-plans")
        .then((data) => setPlans(data))
        .catch((err) => setPlansError(err.message || "Failed to load plans"))
        .finally(() => setPlansLoading(false));
    }
  }, [step, plans.length]);

  const addInvite = () => setInvites((prev) => [...prev, { fullName: "", email: "", phone: "", role: "DISPATCH_MANAGER" }]);
  const removeInvite = (i) => setInvites((prev) => prev.filter((_, idx) => idx !== i));
  const updateInvite = (i, field, val) => setInvites((prev) => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });

  const handleSendInvites = async () => {
    if (!user?.id) return true;
    const valid = invites.filter((inv) => inv.fullName.trim() && inv.email.trim());
    if (valid.length === 0) return true;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess([]);

    try {
      const results = await Promise.allSettled(
        valid.map((inv) =>
          api.post(`/tenants/${user.tenantId}/users`, {
            fullName: inv.fullName.trim(),
            email: inv.email.trim(),
            ...(inv.phone.trim() ? { phone: inv.phone.trim() } : {}),
            role: inv.role,
          })
        )
      );

      const succeeded = [];
      const failed = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") succeeded.push(valid[i].email);
        else failed.push(`${valid[i].email}: ${r.reason?.message || "Failed"}`);
      });

      setInviteSuccess(succeeded);
      if (failed.length > 0) {
        setInviteError(failed.join("\n"));
        return true;
      }
      return false;
    } catch (err) {
      setInviteError(err.message || "Failed to create users");
      return true;
    } finally {
      setInviteLoading(false);
    }
  };

  const handleFinish = () => router.push("/company/dashboard");
  const handleSkip = () => { setSkipLoading(true); router.push("/company/dashboard"); };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
              <span className={`text-xs hidden sm:inline ${i + 1 <= step ? "text-gray-900 font-medium" : "text-gray-500"}`}>{s.title}</span>
              {i < STEPS.length - 1 && <span className="text-gray-300 mx-1">→</span>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {step === 1 && (
            <div className="text-center space-y-4 py-4">
              <PartyPopper size={48} className="text-primary mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Welcome to DLM!</h2>
              <p className="text-sm text-gray-500">Let&apos;s get your company set up in a few steps. You&apos;ll configure your profile, add team members, and choose a plan.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Building2 size={16} /> Company Profile</h3>
              <p className="text-xs text-gray-500">This is your company information as registered.</p>
              <div>
                <label className="text-xs text-gray-500">Company Name</label>
                <input value={user?.tenantName || user?.companyName || ""} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Admin Name</label>
                <input value={user?.fullName || ""} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input value={user?.email || ""} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <input value={user?.phone || ""} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Users size={16} /> Create Team Members</h3>
              <p className="text-xs text-gray-500">Add your team members. Each entry creates a user account.</p>

              {inviteSuccess.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  {inviteSuccess.map((email) => (
                    <p key={email} className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Account created for {email}</p>
                  ))}
                </div>
              )}

              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 whitespace-pre-line">{inviteError}</p>
                </div>
              )}

              {invites.map((inv, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Member {i + 1}</span>
                    {invites.length > 1 && (
                      <button onClick={() => removeInvite(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <input value={inv.fullName} onChange={(e) => updateInvite(i, "fullName", e.target.value)} placeholder="Full name *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="email" value={inv.email} onChange={(e) => updateInvite(i, "email", e.target.value)} placeholder="Email address *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <input type="tel" value={inv.phone} onChange={(e) => updateInvite(i, "phone", e.target.value)} placeholder="Phone (optional)" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    <select value={inv.role} onChange={(e) => updateInvite(i, "role", e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {INVITE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              <button onClick={addInvite} className="text-xs text-primary hover:underline">+ Add another</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><CreditCard size={16} /> Choose a Plan</h3>
              <p className="text-xs text-gray-500">Pick a plan that suits your business needs. Plans are managed by the platform.</p>

              {plansLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}

              {plansError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{plansError}</p>
                </div>
              )}

              {!plansLoading && !plansError && plans.map((plan) => (
                <label key={plan.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedPlan === plan.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={(e) => setSelectedPlan(e.target.value)} className="accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500">
                      Up to {plan.maxVehicles} vehicles, {plan.maxDrivers} drivers
                      {plan.maxTicketsPerMonth ? ` · ${plan.maxTicketsPerMonth} tickets/mo` : ""}
                    </p>
                    {plan.gracePeriodDays > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{plan.gracePeriodDays}-day grace period</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {plan.price.amount === 0 ? "Free" : `${plan.price.currency === "NGN" ? "₦" : "$"}${Number(plan.price.amount).toLocaleString()}/${plan.billingInterval === "MONTHLY" ? "mo" : "yr"}`}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" disabled={skipLoading || inviteLoading} onClick={() => step > 1 ? setStep(step - 1) : handleSkip()}>
              {step === 1 ? (skipLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null) : null}
              {step === 1 ? "Skip" : "Back"}
            </Button>
            <Button
              disabled={inviteLoading}
              onClick={async () => {
                if (step === 3) {
                  const hadError = await handleSendInvites();
                  if (!hadError) setStep(step + 1);
                } else if (step < 4) {
                  setStep(step + 1);
                } else {
                  handleFinish();
                }
              }}
            >
              {inviteLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {step < 4 ? <>Next <ArrowRight size={14} className="ml-1" /></> : "Get Started"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
