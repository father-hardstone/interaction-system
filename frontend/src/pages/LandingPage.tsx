import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050a12] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse delay-700"></div>

      {/* Header/Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-12 transition-all duration-500 flex justify-between items-center bg-slate-900/40 backdrop-blur-md border-b border-white/5 ${scrolled ? 'py-3' : 'py-8'}`}>
        <div className={`flex flex-col justify-center transition-all duration-500 ${scrolled ? 'scale-75 origin-left' : 'scale-100'}`}>
          <div className="text-4xl font-black tracking-tighter text-white leading-none">
            MEDI<span className="text-cyan-400">NET</span>
          </div>
          <div className={`relative transition-all duration-500 overflow-hidden ${scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-6 opacity-100 mt-2'}`}>
            <div className="flex">
              {"Advanced Healthcare Solutions".split("").map((char, i, arr) => (
                <span 
                  key={i} 
                  className="text-[12px] font-bold text-cyan-500 tracking-[0.3em] uppercase transition-all duration-300"
                  style={{ 
                    transitionDelay: `${scrolled ? (arr.length - i) * 5 : i * 5}ms`,
                    opacity: scrolled ? 0 : 1,
                    transform: `translateY(${scrolled ? -10 : 0}px)`
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <Link to="/login" className={`px-8 py-2.5 border border-white/10 rounded-xl font-bold text-white hover:bg-white/5 hover:border-white/20 transition-all ${scrolled ? 'text-xs py-1.5' : 'text-sm'}`}>
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-20 px-16 overflow-hidden w-full">
        <div className="w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Real-Time Patient Insights
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[0.9] uppercase">
              Revolutionizing <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Healthcare Data
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-xl leading-relaxed">
              Clinical Intelligence & Real-Time Analytics for the modern healthcare provider.
              Track every patient journey with precision.
            </p>
            
            <div className="flex gap-4 pt-4">
              <Link to="/login" className="px-10 py-4 bg-cyan-500 text-[#050a12] rounded-full font-black text-lg shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:scale-105 transition-all uppercase tracking-tight">
                Explore Dashboard
              </Link>
            </div>
          </div>

          <div className="relative group lg:block hidden">
            <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-3xl ml-auto">
              <img 
                src="/images/hero_abstract.png" 
                alt="Medical Abstract Visualization" 
                className="w-full h-auto object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 px-16 relative bg-[#050a12]/50 w-full">
        <div className="w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<PatientIcon />}
              title="Patient Overview"
              description="Real-time tracking of patient status, vitals, and clinical history in one unified view."
            />
            <FeatureCard 
              icon={<InteractionIcon />}
              title="Clinical Intelligence"
              description="Advanced data analytics and trend mapping for better diagnostic accuracy and care planning."
            />
            <FeatureCard 
              icon={<ReportIcon />}
              title="Secure Data Vault"
              description="Enterprise-grade encrypted reporting and interaction logs ensuring total HIPAA compliance."
            />
            <FeatureCard 
              icon={<SecurityIcon />}
              title="Predictive Metrics"
              description="Monitor patient recovery rates and clinical outcomes with intelligent predictive modeling."
            />
          </div>
        </div>
      </section>

      {/* Rotating Bulletin Strip */}
      <div className="py-8 bg-cyan-500/5 border-y border-white/5 overflow-hidden whitespace-nowrap w-full">
        <div className="inline-block animate-[marquee_30s_linear_infinite] space-x-12">
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">REAL-TIME CLINICAL INTELLIGENCE</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">HIPAA COMPLIANT DATA VAULT</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">PREDICTIVE PATIENT ANALYTICS</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">99.9% SYSTEM UPTIME</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">NEXT-GEN CASE MANAGEMENT</span>
        </div>
        <div className="inline-block animate-[marquee_30s_linear_infinite] space-x-12 ml-12">
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">REAL-TIME CLINICAL INTELLIGENCE</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">HIPAA COMPLIANT DATA VAULT</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">PREDICTIVE PATIENT ANALYTICS</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">99.9% SYSTEM UPTIME</span>
          <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">•</span>
          <span className="text-2xl font-black text-cyan-400/50 uppercase tracking-widest italic">NEXT-GEN CASE MANAGEMENT</span>
        </div>
      </div>

      {/* Medical Context Section - Centralized */}
      <section className="py-32 px-16 w-full bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="w-full flex flex-col items-center text-center space-y-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase">
            General Medicine
          </div>
          <h2 className="text-5xl lg:text-8xl font-black text-white leading-tight uppercase tracking-tighter max-w-6xl">
            Bridging the Gap Between <br />
            <span className="text-purple-400">Technology and Care</span>
          </h2>
          <p className="text-2xl text-slate-400 leading-relaxed max-w-4xl">
            In modern medicine, data is as critical as diagnosis. MedInteract provides 
            the infrastructure to ensure that every patient interaction is documented 
            with precision, enabling better long-term health outcomes.
          </p>
          <div className="grid md:grid-cols-2 gap-8 pt-8 w-full max-w-6xl">
            <div className="flex flex-col items-center gap-4 p-10 rounded-3xl bg-slate-900/50 border border-white/5 group hover:border-cyan-500/30 transition-all">
              <div className="bg-cyan-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <CheckIcon />
              </div>
              <h4 className="text-white font-bold text-2xl">Standardized Coding</h4>
              <p className="text-slate-400 text-lg">Uses standard medical coding patterns for global interoperability.</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-10 rounded-3xl bg-slate-900/50 border border-white/5 group hover:border-purple-500/30 transition-all">
              <div className="bg-purple-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <CheckIcon />
              </div>
              <h4 className="text-white font-bold text-2xl">HIPAA-Aligned Security</h4>
              <p className="text-slate-400 text-lg">Zero-trust architecture ensuring patient confidentiality at all times.</p>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}} />

      {/* CTA Section */}
      <section className="py-48 px-12 text-center relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        <div className="relative z-10 space-y-12">
          <h2 className="text-5xl lg:text-8xl font-black text-white uppercase tracking-tighter">Ready to modernize?</h2>
          <p className="text-slate-400 text-2xl max-w-3xl mx-auto">Join many medical entities transforming their patient interaction workflows today.</p>
          <div className="flex justify-center">
            <Link to="/login" className="px-20 py-6 bg-white text-[#050a12] rounded-full font-black text-xl hover:scale-110 transition-all shadow-[0_0_100px_rgba(255,255,255,0.2)]">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-slate-900 text-center">
        <div className="text-xl font-bold text-white mb-4">MedInteract</div>
        <p className="text-slate-500 text-sm">© 2026 MedInteract SaaS Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

// Icons
const PatientIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const InteractionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const ReportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const SecurityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const AdminIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
);
const PwaIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default LandingPage;
