import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldAlert, ArrowRight, Loader2, AlertCircle, Heart, Phone, Contact, Pill, Car, ChevronRight, Globe } from "lucide-react";
import { C } from "../constants/theme";
import { triggerHaptic } from "../components/Shared";
import { useLanguage } from "../context/LanguageContext";

export default function Onboarding({ finishOnboarding }) {
    const navigate = useNavigate();
    const { t, lang, changeLang, LANGUAGES } = useLanguage();

    // step 0=Language, 1=Location, 2=EmergencyInfo, 3=Medical, 4=Contacts
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Step 2 — Emergency Info
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [aadhaar, setAadhaar] = useState("");

    // Step 3 — Medical Details
    const [conditions, setConditions] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medications, setMedications] = useState("");
    const [vehicle, setVehicle] = useState("");

    // Step 4 — Emergency Contacts
    const [contacts, setContacts] = useState([
        { name: "", phone: "" },
        { name: "", phone: "" }
    ]);

    const [isPickerSupported, setIsPickerSupported] = useState(false);

    useEffect(() => {
        setIsPickerSupported("contacts" in navigator && "ContactsManager" in window);
    }, []);

    // Clear error when step changes
    useEffect(() => { setErrorMsg(""); }, [step]);

    const handleRequestLocation = () => {
        triggerHaptic("light");
        setLoading(true);
        setErrorMsg("");

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    triggerHaptic("medium");
                    setLoading(false);
                    setStep(2);
                },
                (error) => {
                    setLoading(false);
                    setErrorMsg(t("onboarding.location.denied"));
                    console.warn("Location permission denied:", error.message);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLoading(false);
            setErrorMsg(t("onboarding.location.unsupported"));
        }
    };

    const handlePickContact = async (index) => {
        triggerHaptic("light");
        try {
            const selected = await navigator.contacts.select(["name", "tel"], { multiple: false });
            if (selected?.length > 0) {
                const picked = selected[0];
                setContacts(prev => {
                    const next = [...prev];
                    next[index] = { name: picked.name?.[0] || "", phone: picked.tel?.[0] || "" };
                    return next;
                });
                triggerHaptic("medium");
            }
        } catch (e) {
            console.warn("Contact Picker failed:", e);
        }
    };

    const handleContactChange = (index, field, value) => {
        setContacts(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleNextStep2 = () => {
        triggerHaptic("light");
        if (!name.trim()) { setErrorMsg(t("onboarding.error.name")); return; }
        if (!age.trim() || isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) { setErrorMsg(t("onboarding.error.age")); return; }
        if (!gender) { setErrorMsg(t("onboarding.error.gender")); return; }
        if (!bloodGroup) { setErrorMsg(t("onboarding.error.blood")); return; }
        if (!aadhaar.trim() || !/^\d{12}$/.test(aadhaar.trim())) { setErrorMsg(t("onboarding.error.aadhaar")); return; }
        setStep(3);
    };

    const handleFinishSetup = () => {
        triggerHaptic("medium");
        const validContacts = contacts.filter(c => c.name.trim() && c.phone.trim().length >= 7);
        if (validContacts.length === 0) {
            setErrorMsg(t("onboarding.contacts.error"));
            return;
        }

        const profileObj = {
            name: name.trim(),
            age: age.trim(),
            gender,
            bloodGroup,
            aadhaar: aadhaar.trim(),
            conditions: conditions.trim(),
            allergies: allergies.trim(),
            medications: medications.trim(),
            vehicle: vehicle.trim(),
            lockScreenBeacon: true,
        };
        localStorage.setItem("roadsos_profile_info", JSON.stringify(profileObj));
        localStorage.setItem("roadsos_profile_contacts", JSON.stringify(validContacts));
        localStorage.setItem("roadsos_safety_enabled", "false");
        localStorage.setItem("roadsos_safety_interval", "1");

        finishOnboarding();
        navigate("/", { replace: true });
    };

    const inputCls = "h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium";
    const textareaCls = "p-3.5 rounded-xl border-none outline-none text-white text-sm font-medium resize-none";
    const labelCls = "flex flex-col text-[12px] font-bold text-[#d0c4b5] gap-1.5";

    const StepDots = ({ current }) => (
        <div className="flex items-center justify-center gap-2 mb-5">
            {[2, 3, 4].map(s => (
                <div key={s} className="rounded-full transition-all duration-300"
                    style={{ width: current === s ? 24 : 8, height: 8, background: current === s ? C.primary : C.surfaceContainerHigh }} />
            ))}
        </div>
    );

    const ErrorBanner = () => errorMsg ? (
        <div className="p-4 rounded-[24px] text-left flex items-start gap-3 border border-red-500/20 bg-red-950/20 text-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
            <p className="text-[13px] font-medium leading-relaxed">{errorMsg}</p>
        </div>
    ) : null;

    return (
        <div className="h-[100dvh] flex flex-col items-center justify-center p-6 text-center overflow-y-auto" style={{ background: C.bg }}>

            {/* ── STEP 0: Language Selection ── */}
            {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full gap-8 z-10" style={{ animation: "slide-up-md 0.5s ease-out both" }}>
                    <div className="h-24 w-24 rounded-full flex items-center justify-center" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
                        <Globe className="h-12 w-12" />
                    </div>

                    <div>
                        <h1 className="text-[28px] tracking-wide mb-2 roadsos-title" style={{ color: C.onSurface }}>
                            {t("onboarding.lang.title")}
                        </h1>
                        <p className="text-[14px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
                            {t("onboarding.lang.subtitle")}
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => { triggerHaptic("light"); changeLang(l.code); }}
                                className="w-full h-16 rounded-[20px] flex items-center justify-between px-5 border-none outline-none cursor-pointer active:scale-95 transition-all"
                                style={{
                                    background: lang === l.code ? C.primaryContainer : C.surfaceContainer,
                                    border: lang === l.code ? `2px solid ${C.primary}` : "2px solid transparent",
                                    color: lang === l.code ? C.onPrimaryContainer : C.onSurface,
                                }}
                            >
                                <span className="text-[16px] font-bold">{l.nativeLabel}</span>
                                <span className="text-[13px] opacity-60">{l.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { triggerHaptic("medium"); setStep(1); }}
                        className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[17px] font-bold cursor-pointer border-none outline-none active:scale-95 transition-all"
                        style={{ background: C.primary, color: C.onPrimary }}
                    >
                        {t("onboarding.lang.continue")} <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* ── STEP 1: Location Access ── */}
            {step === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full gap-8 z-10" style={{ animation: "slide-up-md 0.5s ease-out both" }}>
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: C.primary }} />
                        <div className="h-28 w-28 rounded-full flex items-center justify-center relative md-elevation-2" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
                            <ShieldAlert className="h-14 w-14" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-[32px] tracking-wide mb-3 roadsos-title" style={{ color: C.onSurface }}>
                            Safe<span style={{ color: C.primary }}>Miles</span>
                        </h1>
                        <p className="text-[16px] leading-relaxed mb-6" style={{ color: C.onSurfaceVariant }}>
                            {t("onboarding.location.body")}
                        </p>
                        <div className="p-4 rounded-[24px] text-left flex items-start gap-4 mb-4" style={{ background: C.surfaceContainer }}>
                            <MapPin className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: C.primary }} />
                            <p className="text-[14px]" style={{ color: C.onSurface }}>
                                {t("onboarding.location.why")} <strong style={{ color: C.primary }}>{t("onboarding.location.whyBold")}</strong>
                            </p>
                        </div>
                        <ErrorBanner />
                    </div>

                    <div className="w-full max-w-sm pb-8 z-10">
                        <button
                            onClick={handleRequestLocation}
                            disabled={loading}
                            className="w-full h-16 rounded-full flex items-center justify-center gap-3 text-[18px] font-bold cursor-pointer border-none outline-none md-ripple active:scale-95 transition-all"
                            style={{ background: C.primary, color: C.onPrimary }}
                        >
                            {loading ? <><Loader2 className="h-6 w-6 animate-spin" /> {t("onboarding.location.locating")}</> : <>{t("onboarding.location.grant")} <ArrowRight className="h-6 w-6" /></>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Emergency Info ── */}
            {step === 2 && (
                <div className="flex-1 flex flex-col max-w-sm w-full gap-5 z-10 py-6 text-left" style={{ animation: "slide-up-md 0.4s ease-out both" }}>
                    <div className="text-center">
                        <h1 className="text-[26px] tracking-wide mb-1 roadsos-title" style={{ color: C.onSurface }}>{t("onboarding.info.title")}</h1>
                        <p className="text-[13px]" style={{ color: C.onSurfaceVariant }}>{t("onboarding.info.subtitle")}</p>
                    </div>
                    <StepDots current={2} />

                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-xs font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Heart className="h-4 w-4 text-[#ff5449]" /> {t("onboarding.info.section")}
                        </h2>
                        <label className={labelCls}>
                            {t("onboarding.info.name")}
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder={t("onboarding.info.namePlaceholder")}
                                className={inputCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={labelCls}>
                                {t("onboarding.info.age")}
                                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                                    placeholder={t("onboarding.info.agePlaceholder")}
                                    className={inputCls} style={{ background: C.surfaceContainerHigh }} />
                            </label>
                            <label className={labelCls}>
                                {t("onboarding.info.gender")}
                                <select value={gender} onChange={e => { triggerHaptic("light"); setGender(e.target.value); }}
                                    className={inputCls} style={{ background: C.surfaceContainerHigh }}>
                                    <option value="">{t("onboarding.info.genderSelect")}</option>
                                    <option value="Male">{t("onboarding.info.male")}</option>
                                    <option value="Female">{t("onboarding.info.female")}</option>
                                    <option value="Other">{t("onboarding.info.other")}</option>
                                </select>
                            </label>
                        </div>
                        <label className={labelCls}>
                            {t("onboarding.info.blood")}
                            <select value={bloodGroup} onChange={e => { triggerHaptic("light"); setBloodGroup(e.target.value); }}
                                className={inputCls} style={{ background: C.surfaceContainerHigh }}>
                                <option value="">{t("onboarding.info.bloodSelect")}</option>
                                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </label>
                        <label className={labelCls}>
                            {t("onboarding.info.aadhaar")}
                            <input type="text" value={aadhaar} maxLength={12}
                                onChange={e => setAadhaar(e.target.value.replace(/\D/g, ""))}
                                placeholder={t("onboarding.info.aadhaarPlaceholder")}
                                className={inputCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                    </div>

                    <ErrorBanner />
                    <button onClick={handleNextStep2}
                        className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[17px] font-black cursor-pointer border-none outline-none active:scale-95 transition-all mt-auto"
                        style={{ background: C.primary, color: C.onPrimary }}>
                        {t("onboarding.info.next")} <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* ── STEP 3: Medical Details ── */}
            {step === 3 && (
                <div className="flex-1 flex flex-col max-w-sm w-full gap-5 z-10 py-6 text-left" style={{ animation: "slide-up-md 0.4s ease-out both" }}>
                    <div className="text-center">
                        <h1 className="text-[26px] tracking-wide mb-1 roadsos-title" style={{ color: C.onSurface }}>{t("onboarding.medical.title")}</h1>
                        <p className="text-[13px]" style={{ color: C.onSurfaceVariant }}>{t("onboarding.medical.subtitle")}</p>
                    </div>
                    <StepDots current={3} />

                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-xs font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Pill className="h-4 w-4 text-[#ff5449]" /> {t("onboarding.medical.section")}
                            <span className="text-white/30 font-normal normal-case tracking-normal text-[11px]">{t("onboarding.medical.optional")}</span>
                        </h2>
                        <label className={labelCls}>
                            {t("onboarding.medical.conditions")}
                            <textarea value={conditions} onChange={e => setConditions(e.target.value)}
                                placeholder={t("onboarding.medical.conditionsPlaceholder")} rows={2}
                                className={textareaCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                        <label className={labelCls}>
                            {t("onboarding.medical.allergies")}
                            <textarea value={allergies} onChange={e => setAllergies(e.target.value)}
                                placeholder={t("onboarding.medical.allergiesPlaceholder")} rows={2}
                                className={textareaCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                        <label className={labelCls}>
                            {t("onboarding.medical.medications")}
                            <textarea value={medications} onChange={e => setMedications(e.target.value)}
                                placeholder={t("onboarding.medical.medicationsPlaceholder")} rows={2}
                                className={textareaCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                    </div>

                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-xs font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Car className="h-4 w-4 text-[#ff5449]" /> {t("onboarding.medical.vehicle")}
                            <span className="text-white/30 font-normal normal-case tracking-normal text-[11px]">{t("onboarding.medical.optional")}</span>
                        </h2>
                        <label className={labelCls}>
                            {t("onboarding.medical.vehicle")}
                            <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)}
                                placeholder={t("onboarding.medical.vehiclePlaceholder")}
                                className={inputCls} style={{ background: C.surfaceContainerHigh }} />
                        </label>
                    </div>

                    <button onClick={() => { triggerHaptic("light"); setStep(4); }}
                        className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[17px] font-black cursor-pointer border-none outline-none active:scale-95 transition-all mt-auto"
                        style={{ background: C.primary, color: C.onPrimary }}>
                        {t("onboarding.medical.next")} <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* ── STEP 4: Emergency Contacts ── */}
            {step === 4 && (
                <div className="flex-1 flex flex-col max-w-sm w-full gap-5 z-10 py-6 text-left" style={{ animation: "slide-up-md 0.4s ease-out both" }}>
                    <div className="text-center">
                        <h1 className="text-[26px] tracking-wide mb-1 roadsos-title" style={{ color: C.onSurface }}>{t("onboarding.contacts.title")}</h1>
                        <p className="text-[13px]" style={{ color: C.onSurfaceVariant }}>{t("onboarding.contacts.subtitle")}</p>
                    </div>
                    <StepDots current={4} />

                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-xs font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[#ff5449]" /> {t("onboarding.contacts.section")}
                        </h2>
                        {contacts.map((contact, idx) => (
                            <div key={idx} className="flex flex-col gap-2.5 border-b border-white/5 pb-3.5 last:border-none last:pb-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-white/40 uppercase">{t("onboarding.contacts.label")}{idx + 1}</span>
                                    {isPickerSupported && (
                                        <button onClick={() => handlePickContact(idx)}
                                            className="text-[11px] font-bold bg-[#ffdad6] text-[#93000a] border-none outline-none rounded-lg px-2.5 py-1.5 cursor-pointer flex items-center gap-1 active:scale-95 transition-all">
                                            <Contact className="h-3.5 w-3.5" /> {t("onboarding.contacts.pick")}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" value={contact.name}
                                        onChange={e => handleContactChange(idx, "name", e.target.value)}
                                        placeholder={t("onboarding.contacts.name")}
                                        className="h-11 px-3 rounded-xl border-none outline-none text-white text-sm font-medium"
                                        style={{ background: C.surfaceContainerHigh }} />
                                    <input type="tel" value={contact.phone}
                                        onChange={e => handleContactChange(idx, "phone", e.target.value)}
                                        placeholder={t("onboarding.contacts.phone")}
                                        className="h-11 px-3 rounded-xl border-none outline-none text-white text-sm font-medium"
                                        style={{ background: C.surfaceContainerHigh }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <ErrorBanner />
                    <button onClick={handleFinishSetup}
                        className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[17px] font-black cursor-pointer border-none outline-none active:scale-95 transition-all mt-auto"
                        style={{ background: C.primary, color: C.onPrimary }}>
                        {t("onboarding.contacts.finish")} <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}