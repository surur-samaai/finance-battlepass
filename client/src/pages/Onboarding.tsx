import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { completeOnboarding } from "../api/user";
import { useToast } from "../context/ToastContext";
import avatarPlaceholder from "../assets/avatar-placeholder.svg";

type Step = 1 | 2 | 3 | 4 | 5;

interface FixedCostRow {
  name: string;
  amount: string;
}

const steps: { id: Step; label: string }[] = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Bank" },
  { id: 3, label: "Budget" },
  { id: 4, label: "Budgteer" },
  { id: 5, label: "Ready" },
];

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { appUser, refetchAppUser } = useAuth();
  const { showToasts } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [bankConnected, setBankConnected] = useState(false);
  const [income, setIncome] = useState("");
  const [fixedCosts, setFixedCosts] = useState<FixedCostRow[]>([
    { name: "", amount: "" },
  ]);
  const [budgteerName, setBudgteerName] = useState("");
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addFixedCostRow = () => {
    setFixedCosts((prev) => [...prev, { name: "", amount: "" }]);
  };

  const updateFixedCost = (index: number, field: keyof FixedCostRow, value: string) => {
    setFixedCosts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const monthlyIncome = Number(income);
  const parsedFixedCosts = useMemo(
    () =>
      fixedCosts
        .map((row) => {
          const amount = Number(row.amount);
          return {
            name: row.name.trim(),
            amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
          };
        })
        .filter((row) => row.name.length > 0 || row.amount > 0),
    [fixedCosts]
  );
  const fixedCostTotal = parsedFixedCosts.reduce(
    (total, row) => total + row.amount,
    0
  );
  const playableBalance =
    Number.isFinite(monthlyIncome) && monthlyIncome > 0
      ? monthlyIncome - fixedCostTotal
      : 0;

  const goToStep = (nextStep: Step) => {
    setSubmitError(null);
    setStep(nextStep);
  };

  const handleBankChoice = (showPlaceholderToast: boolean) => {
    if (showPlaceholderToast) {
      showToasts([
        "Bank connection coming soon. Using manual mode for now.",
      ]);
    }
    setBankConnected(false);
    goToStep(3);
  };

  const handleFinancialNext = () => {
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
      setIncomeError("Enter a positive monthly net income.");
      return;
    }
    setIncomeError(null);
    goToStep(4);
  };

  const handleBudgteerNext = () => {
    if (budgteerName.trim().length === 0) {
      setNameError("Give your Budgteer a name.");
      return;
    }
    setNameError(null);
    goToStep(5);
  };

  const handleComplete = async () => {
    if (appUser === null || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding(appUser.id, {
        budgteer_name: budgteerName.trim(),
        monthly_income: monthlyIncome,
        fixed_costs: parsedFixedCosts,
        bank_connected: bankConnected,
      });
      await refetchAppUser();
      navigate("/", { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Could not complete onboarding. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Budgt Hero setup
          </p>
          <div className="grid grid-cols-5 gap-2">
            {steps.map(({ id, label }) => (
              <div key={id} className="space-y-2">
                <div
                  className={`h-2 rounded-full ${
                    id <= step ? "bg-accent" : "bg-white/10"
                  }`}
                />
                <p
                  className={`hidden text-xs sm:block ${
                    id === step ? "text-white" : "text-white/30"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">
                  Welcome to Budgt Hero.
                </h1>
                <p className="text-sm text-white/50">
                  Let's get you set up. This takes about 2 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/80"
              >
                Let's go
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">
                  Connect your bank account.
                </h1>
                <p className="text-sm text-white/50">
                  We use Stitch to securely read your transactions. Your credentials never touch
                  our servers.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleBankChoice(true)}
                  className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/80"
                >
                  Connect my bank
                </button>
                <button
                  type="button"
                  onClick={() => handleBankChoice(false)}
                  className="w-full rounded-md border border-white/10 px-4 py-3 font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
                >
                  Skip for now — use manual mode
                </button>
              </div>
              <p className="text-xs text-white/35">
                Supported banks: FNB, Nedbank, Standard Bank, Absa, Capitec
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">
                  Set up your budget.
                </h1>
                <p className="text-sm text-white/50">
                  Your fixed costs are locked away from the money you can play with this season.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-white/50">
                    Monthly net income (ZAR)
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
                    <span className="font-semibold text-white/40">R</span>
                    <input
                      type="number"
                      value={income}
                      onChange={(event) => {
                        setIncome(event.target.value);
                        setIncomeError(null);
                      }}
                      placeholder="0.00"
                      className="flex-1 bg-transparent py-2 text-white placeholder-white/20 focus:outline-none"
                    />
                  </div>
                  {incomeError && (
                    <p className="mt-2 text-xs text-red-300">{incomeError}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Fixed costs
                    </h2>
                    <p className="text-xs text-white/40">
                      Rent, medical aid, savings, subscriptions.
                    </p>
                  </div>
                  {fixedCosts.map((row, index) => (
                    <div key={index} className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(event) =>
                          updateFixedCost(index, "name", event.target.value)
                        }
                        placeholder="e.g. Rent"
                        className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3">
                        <span className="text-sm text-white/40">R</span>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(event) =>
                            updateFixedCost(index, "amount", event.target.value)
                          }
                          placeholder="0"
                          className="w-full bg-transparent py-2 text-sm text-white placeholder-white/20 focus:outline-none sm:w-24"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFixedCostRow}
                    className="text-sm text-accent transition-colors hover:text-accent/80"
                  >
                    + Add another
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="flex-1 rounded-md border border-white/10 px-4 py-3 font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinancialNext}
                  className="flex-1 rounded-md bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/80"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">
                  Create your Budgteer.
                </h1>
                <p className="text-sm text-white/50">
                  This is your companion for the season.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
                <div className="mx-auto rounded-full border border-white/10 bg-white/5 p-4">
                  <img
                    src={avatarPlaceholder}
                    alt=""
                    className="h-32 w-32"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">
                      Budgteer name
                    </label>
                    <input
                      type="text"
                      value={budgteerName}
                      onChange={(event) => {
                        setBudgteerName(event.target.value);
                        setNameError(null);
                      }}
                      placeholder="Give your Budgteer a name"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none"
                    />
                    {nameError && (
                      <p className="mt-2 text-xs text-red-300">{nameError}</p>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    You'll customise your avatar after setup.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="flex-1 rounded-md border border-white/10 px-4 py-3 font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleBudgteerNext}
                  className="flex-1 rounded-md bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/80"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">You're ready.</h1>
                <p className="text-sm text-white/50">
                  Review your setup and start your first season.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <img
                    src={avatarPlaceholder}
                    alt=""
                    className="h-16 w-16 rounded-full bg-white/5"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Budgteer
                    </p>
                    <p className="text-xl font-semibold text-white">
                      {budgteerName.trim()}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-4 pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Playable balance
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-white">
                      {zarFormatter.format(playableBalance)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Bank status
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-white">
                      {bankConnected ? "Bank connected" : "Manual mode"}
                    </dd>
                  </div>
                </dl>
              </div>

              {submitError && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {submitError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={submitting}
                className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Starting..." : "Start my Season"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
