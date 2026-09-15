import React from 'react';
import { RotateCcw, CreditCard, CheckCircle, Clock, ShieldCheck, Mail } from 'lucide-react';

interface RefundProps {
  appName: string;
}

const RefundPolicy: React.FC<RefundProps> = ({ appName }) => {
  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
          <RotateCcw size={14} /> Billing & Guarantees
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Refund & Cancellation Policy
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
          Clear, transparent policies regarding subscription purchases, renewals, and cancellations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 md:p-12 space-y-10 text-slate-700 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">1</span>
            Subscription Cancellation
          </h2>
          <p>
            At <strong>{appName}</strong>, you have full control over your institutional subscription. School administrators may cancel recurring subscription plans at any time directly through the School Billing Dashboard or by notifying our support team.
          </p>
          <p>
            Upon cancellation, your subscription will remain active until the conclusion of your current paid billing cycle. You will not be billed for subsequent renewal cycles.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">2</span>
            7-Day Money-Back Guarantee
          </h2>
          <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 text-emerald-950">
            <div className="flex items-center gap-2 font-black text-base text-emerald-900">
              <ShieldCheck size={20} className="text-emerald-600" />
              Risk-Free Evaluation Window
            </div>
            <p className="text-sm leading-relaxed">
              If you purchase an individual teacher or school plan and find that our platform does not suit your curriculum assessment needs, you are eligible to request a full refund within <strong>7 days</strong> of your initial purchase.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">3</span>
            Refund Eligibility & Conditions
          </h2>
          <ul className="space-y-2.5 list-disc pl-5 text-slate-600 text-sm">
            <li>Refund requests must be submitted within 7 calendar days of the initial transaction.</li>
            <li>Accounts that have engaged in mass automated data scraping or violated terms of service are not eligible for refunds.</li>
            <li>Custom enterprise setup fees (e.g., custom question digitizations or dedicated servers) are non-refundable once work has commenced.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black">4</span>
            Processing Timeline
          </h2>
          <p>
            Approved refunds are credited back to the original method of payment (Debit/Credit Card, Bank Transfer, JazzCash/EasyPaisa) within <strong>5 to 10 business days</strong> depending on your financial institution.
          </p>
        </section>

        {/* Section 5 - Contact */}
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Requesting a Refund</h2>
          <p>To request a refund or billing inquiry, please email our billing team with your Invoice/Account ID:</p>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold text-slate-800 w-fit">
            <Mail size={16} className="text-indigo-600" />
            <span>billing@{appName.toLowerCase().replace(/\s+/g, '')}.com</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RefundPolicy;
