import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';

// ── FALLBACK DEFAULTS ────────────────────────────────────────────────────
// Used ONLY when the database/API isn't reachable (e.g. backend down or
// MongoDB not connected). The moment the DB responds — or the admin changes
// something — these are replaced by whatever is actually in the database.
const DEFAULT_SETTINGS = {
  isActive: false,
  price: "৪,৫০০",
  oldPrice: "১২,০০০",
  discountText: "৬৩% ছাড়",
  bootcampFeeLabel: "বুটক্যাম্প ফি",
  bootcampFee: "৫,৫০০ টাকা",
  disclaimerBadgeText: "Disclaimer",
  disclaimerLine1: "৫৫০০ টাকায় ভর্তির এটাই শেষ সুযোগ,",
  disclaimerLine2: "পরের ব্যাচ থেকে ভর্তি ফি বেড়ে যাবে।",
  paymentButtonsLabel: "পেমেন্ট করো:",
  enrollButtonText: "ভর্তি হও →",
  enrollButtonLink: "/enroll",
  modalCloseButtonText: "বুঝেছি",
  modalStepsHeading: "কীভাবে পেমেন্ট করবে:",
};

const DEFAULT_METHODS = [
  {
    _id: "default-bkash",
    label: "bKash",
    accountLabel: "bKash নম্বর (Personal)",
    accountNumber: "01XXXXXXXXX",
    reference: "তোমার নাম / ফোন নম্বর",
    steps: [
      "bKash অ্যাপ থেকে Send Money অপশনে যাও",
      "উপরের নম্বরে টাকা পাঠাও",
      "Reference এ তোমার নাম/ফোন নম্বর দাও",
      "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
    ],
  },
  {
    _id: "default-nagad",
    label: "Nagad",
    accountLabel: "Nagad নম্বর (Personal)",
    accountNumber: "01XXXXXXXXX",
    reference: "তোমার নাম / ফোন নম্বর",
    steps: [
      "Nagad অ্যাপ থেকে Send Money অপশনে যাও",
      "উপরের নম্বরে টাকা পাঠাও",
      "Reference এ তোমার নাম/ফোন নম্বর দাও",
      "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
    ],
  },
  {
    _id: "default-rocket",
    label: "Rocket",
    accountLabel: "Rocket নম্বর (Personal)",
    accountNumber: "01XXXXXXXXX-X",
    reference: "তোমার নাম / ফোন নম্বর",
    steps: [
      "Rocket অ্যাপ থেকে Send Money অপশনে যাও",
      "উপরের নম্বরে টাকা পাঠাও",
      "Reference এ তোমার নাম/ফোন নম্বর দাও",
      "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
    ],
  },
  {
    _id: "default-visa",
    label: "Visa/MC",
    accountLabel: "কার্ড পেমেন্ট",
    accountNumber: "চেকআউট পেজে কার্ড দিয়ে পে করো",
    reference: "",
    steps: [
      "\"ভর্তি হও\" বাটনে ক্লিক করো",
      "চেকআউট পেজে Visa/Mastercard সিলেক্ট করো",
      "কার্ডের তথ্য দিয়ে পেমেন্ট সম্পন্ন করো",
    ],
  },
  {
    _id: "default-bank",
    label: "Bank",
    accountLabel: "ব্যাংক অ্যাকাউন্ট নম্বর",
    accountNumber: "XXXX-XXXXXXX-XXX",
    reference: "তোমার নাম উল্লেখ করে",
    steps: [
      "নিকটস্থ ব্রাঞ্চ থেকে উপরের অ্যাকাউন্টে টাকা জমা দাও",
      "Deposit slip এ তোমার নাম লিখো",
      "জমার রসিদের ছবি/স্ক্রিনশট রাখো",
    ],
  },
];

const PaymentMethodModal = ({ method, settings, onClose }) => {
  if (!method) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-purple-800 p-6"
        style={{ background: "#150a2e" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">{method.label} দিয়ে পেমেন্ট</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="বন্ধ করো"
          >
            ×
          </button>
        </div>

        <div className="rounded-xl border border-purple-800 p-4 mb-4" style={{ background: "#1a0533" }}>
          <p className="text-gray-400 text-xs mb-1">{method.accountLabel}</p>
          <p className="text-white font-bold text-base break-all">{method.accountNumber}</p>
          {method.reference && (
            <p className="text-gray-400 text-xs mt-2">
              Reference: <span className="text-purple-300">{method.reference}</span>
            </p>
          )}
        </div>

        {method.steps?.length > 0 && (
          <>
            <p className="text-gray-300 text-sm font-medium mb-2">{settings.modalStepsHeading}</p>
            <ol className="space-y-1.5 mb-5">
              {method.steps.map((step, i) => (
                <li key={i} className="text-gray-400 text-sm flex gap-2">
                  <span className="text-purple-400 font-bold">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}
        >
          {settings.modalCloseButtonText}
        </button>
      </div>
    </div>
  );
};

const PaymentMethodButtons = ({ methods, label, onSelect }) => (
  <div className="flex items-center gap-2 flex-wrap justify-center">
    <span className="text-gray-400 text-sm">{label}</span>
    {methods.map(m => (
      <button
        key={m._id}
        type="button"
        onClick={() => onSelect(m)}
        className="border border-purple-800 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-purple-900 hover:text-purple-100"
        style={{ background: "#1a0533" }}
      >
        {m.label}
      </button>
    ))}
  </div>
);

const CoursePaymentSection = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings (singleton: active/inactive + price/disclaimer texts) and
  // payment methods (collection: bKash/Nagad/etc + their steps) from the DB.
  // If the database/API isn't reachable, the DEFAULT_* fallbacks above stay
  // in place so the section always renders something sensible.
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get('/course-payment/settings'),
      api.get('/course-payment/methods'),
    ]).then(([settingsRes, methodsRes]) => {
      if (cancelled) return;
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);
      if (methodsRes.status === 'fulfilled' && methodsRes.value.data?.length > 0) {
        setMethods(methodsRes.value.data);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <section style={{ background: "#0d011f" }} className="border-y border-purple-900 py-5 px-4">
      <div className="max-w-6xl mx-auto">

        {settings.isActive ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-2xl">৳{settings.price}</span>
              {settings.oldPrice && (
                <span className="text-gray-500 line-through text-sm">৳{settings.oldPrice}</span>
              )}
              {settings.discountText && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                >
                  {settings.discountText}
                </span>
              )}
            </div>

            <PaymentMethodButtons methods={methods} label={settings.paymentButtonsLabel} onSelect={setSelectedMethod} />

            <Link
              to={settings.enrollButtonLink || "/enroll"}
              className="text-white font-bold px-6 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all hover:scale-105"
              style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}
            >
              {settings.enrollButtonText}
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-purple-800 px-6 py-7 sm:px-10 sm:py-8 text-center"
            style={{ background: "#150a2e" }}
          >
            <p className="text-white font-bold text-xl sm:text-2xl mb-1">{settings.bootcampFeeLabel}</p>
            <p
              className="font-extrabold text-3xl sm:text-4xl mb-5"
              style={{ color: "#34d399" }}
            >
              ৳{settings.bootcampFee}
            </p>

            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px flex-1 max-w-[80px]" style={{ background: "#4c1d95" }} />
              <span
                className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-1.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #ea580c, #dc2626)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {settings.disclaimerBadgeText}
              </span>
              <span className="h-px flex-1 max-w-[80px]" style={{ background: "#4c1d95" }} />
            </div>

            <p className="text-gray-300 text-sm sm:text-base font-medium">
              {settings.disclaimerLine1}
            </p>
            <p className="text-sm sm:text-base font-bold mb-5" style={{ color: "#e879f9" }}>
              {settings.disclaimerLine2}
            </p>

            <PaymentMethodButtons methods={methods} label={settings.paymentButtonsLabel} onSelect={setSelectedMethod} />
          </div>
        )}
      </div>

      <PaymentMethodModal method={selectedMethod} settings={settings} onClose={() => setSelectedMethod(null)} />
    </section>
  );
};

export default CoursePaymentSection;
