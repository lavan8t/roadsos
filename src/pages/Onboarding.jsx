import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldAlert, ArrowRight, Loader2, AlertCircle, Heart, Phone, Contact } from "lucide-react";
import { C } from "../constants/theme";
import { triggerHaptic } from "../components/Shared";

export default function Onboarding({ finishOnboarding }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Location Access, 2 = Profile Details
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Step 2 profile details state
    const [name, setName] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [aadhaar, setAadhaar] = useState("");
    const [contacts, setContacts] = useState([
        { name: "", phone: "" },
        { name: "", phone: "" }
    ]);

    const [isPickerSupported, setIsPickerSupported] = useState(false);

    useEffect(() => {
        setIsPickerSupported("contacts" in navigator && "ContactsManager" in window);
    }, []);

    const handleRequestLocation = () => {
        triggerHaptic("light");
        setLoading(true);
        setErrorMsg("");

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    // Success! They granted permission. Move to step 2
                    triggerHaptic("medium");
                    setLoading(false);
                    setStep(2);
                },
                (error) => {
                    setLoading(false);
                    setErrorMsg("Location access is required. Please allow location access in your browser settings to continue.");
                    console.warn("Location permission denied during onboarding:", error.message);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLoading(false);
            setErrorMsg("Geolocation is not supported by your browser. SafeMiles requires location access to work.");
        }
    };

    const handlePickContact = async (index) => {
        triggerHaptic("light");
        try {
            const props = ["name", "tel"];
            const selected = await navigator.contacts.select(props, { multiple: false });
            if (selected && selected.length > 0) {
                const picked = selected[0];
                const pickedName = picked.name?.[0] || "";
                const pickedPhone = picked.tel?.[0] || "";
                
                setContacts(prev => {
                    const next = [...prev];
                    next[index] = { name: pickedName, phone: pickedPhone };
                    return next;
                });
                triggerHaptic("medium");
            }
        } catch (e) {
            console.warn("Native Contact Picker failed:", e);
        }
    };

    const handleContactChange = (index, field, value) => {
        setContacts(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleFinishSetup = () => {
        triggerHaptic("medium");

        // Validation
        if (!name.trim()) {
            setErrorMsg("Please enter your Full Name.");
            return;
        }
        if (!bloodGroup) {
            setErrorMsg("Please select your Blood Group.");
            return;
        }
        if (!aadhaar.trim() || !/^\d{12}$/.test(aadhaar.trim())) {
            setErrorMsg("Please enter a valid 12-digit Aadhaar Number.");
            return;
        }

        const validContacts = contacts.filter(c => c.name.trim() && c.phone.trim().length >= 7);
        if (validContacts.length === 0) {
            setErrorMsg("Please add at least one emergency contact with a valid name and phone number.");
            return;
        }

        setErrorMsg("");

        // Save profile
        const profileObj = {
            name: name.trim(),
            bloodGroup,
            aadhaar: aadhaar.trim(),
            conditions: "",
            allergies: ""
        };
        localStorage.setItem("roadsos_profile_info", JSON.stringify(profileObj));

        // Save contacts
        localStorage.setItem("roadsos_profile_contacts", JSON.stringify(validContacts));

        // Set default safety timer options
        localStorage.setItem("roadsos_safety_enabled", "false");
        localStorage.setItem("roadsos_safety_interval", "1");

        finishOnboarding();
        navigate("/", { replace: true });
    };

    return (
        <div className="h-[100dvh] flex flex-col items-center justify-center p-6 text-center overflow-y-auto" style={{ background: C.bg }}>
            {step === 1 ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full gap-8 z-10" style={{ animation: "slide-up-md 0.5s ease-out both" }}>
                    {/* Icon Header */}
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: C.primary }}></div>
                        <div className="h-28 w-28 rounded-full flex items-center justify-center relative md-elevation-2" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
                            <ShieldAlert className="h-14 w-14" />
                        </div>
                    </div>

                    {/* Text Details */}
                    <div>
                        <h1 className="text-[32px] tracking-wide mb-3 roadsos-title" style={{ color: C.onSurface }}>
                            Safe<span style={{ color: C.primary }}>Miles</span>
                        </h1>
                        <p className="text-[16px] leading-relaxed mb-6" style={{ color: C.onSurfaceVariant }}>
                            Your rapid response roadside assistant. We connect you to nearby hospitals, police, and mechanics instantly.
                        </p>

                        <div className="p-4 rounded-[24px] text-left flex items-start gap-4 mb-4" style={{ background: C.surfaceContainer }}>
                            <MapPin className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: C.primary }} />
                            <p className="text-[14px]" style={{ color: C.onSurface }}>
                                To find help near you and share your emergency coordinates, <strong style={{ color: C.primary }}>SafeMiles needs access to your location.</strong>
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="p-4 rounded-[24px] text-left flex items-start gap-3 mb-2 border border-red-500/20 bg-red-950/20 text-red-200">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
                                <p className="text-[13px] font-medium leading-relaxed">{errorMsg}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="w-full max-w-sm pb-8 z-10" style={{ animation: "slide-up-md 0.5s ease-out 0.2s both" }}>
                        <button
                            onClick={handleRequestLocation}
                            disabled={loading}
                            className="w-full h-16 rounded-full flex items-center justify-center gap-3 text-[18px] font-bold cursor-pointer border-none outline-none md-ripple active:scale-95 transition-all"
                            style={{ background: C.primary, color: C.onPrimary }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" /> Locating...
                                </>
                            ) : (
                                <>
                                    Grant Location Access <ArrowRight className="h-6 w-6" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col max-w-sm w-full gap-6 z-10 py-6 text-left" style={{ animation: "slide-up-md 0.5s ease-out both" }}>
                    <div>
                        <h1 className="text-[28px] tracking-wide mb-1.5 roadsos-title text-center" style={{ color: C.onSurface }}>
                            Setup Profile
                        </h1>
                        <p className="text-[14px] leading-relaxed text-center mb-4" style={{ color: C.onSurfaceVariant }}>
                            Add emergency info and contacts to complete setup.
                        </p>
                    </div>

                    {/* Section 1: Emergency Info */}
                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-sm font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Heart className="h-4.5 w-4.5 text-[#ff5449]" /> Emergency Info
                        </h2>

                        <div className="flex flex-col gap-3">
                            <label className="flex flex-col text-[12px] font-bold text-[#d0c4b5] gap-1">
                                Full Name
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="h-11 px-3.5 rounded-xl border-none outline-none text-white text-sm font-medium"
                                    style={{ background: C.surfaceContainerHigh }}
                                />
                            </label>

                            <label className="flex flex-col text-[12px] font-bold text-[#d0c4b5] gap-1">
                                Blood Group
                                <select
                                    value={bloodGroup}
                                    onChange={e => {
                                        triggerHaptic("light");
                                        setBloodGroup(e.target.value);
                                    }}
                                    className="h-11 px-3.5 rounded-xl border-none outline-none text-white text-sm font-medium"
                                    style={{ background: C.surfaceContainerHigh }}
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </label>

                            <label className="flex flex-col text-[12px] font-bold text-[#d0c4b5] gap-1">
                                Aadhaar Number
                                <input
                                    type="text"
                                    placeholder="12-digit Aadhaar Number"
                                    value={aadhaar}
                                    maxLength={12}
                                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                                    className="h-12 px-4 rounded-xl border-none outline-none text-white text-sm font-medium"
                                    style={{ background: C.surfaceContainerHigh }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Section 2: Emergency Contacts */}
                    <div className="rounded-[24px] p-5 flex flex-col gap-4" style={{ background: C.surfaceContainer }}>
                        <h2 className="text-sm font-black tracking-wider text-[#ffb4ab] uppercase flex items-center gap-2">
                            <Phone className="h-4.5 w-4.5 text-[#ff5449]" /> Emergency Contacts
                        </h2>

                        {contacts.map((contact, idx) => (
                            <div key={idx} className="flex flex-col gap-2.5 border-b border-white/5 pb-3.5 last:border-none last:pb-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-white/40 uppercase">Contact #{idx + 1}</span>
                                    {isPickerSupported && (
                                        <button
                                            onClick={() => handlePickContact(idx)}
                                            className="text-[11px] font-bold bg-[#ffdad6] text-[#93000a] border-none outline-none rounded-lg px-2.5 py-1.5 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            <Contact className="h-3.5 w-3.5" /> Pick Contact
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={contact.name}
                                        onChange={e => handleContactChange(idx, "name", e.target.value)}
                                        placeholder="Name"
                                        className="h-11 px-3 rounded-xl border-none outline-none text-white text-sm font-medium"
                                        style={{ background: C.surfaceContainerHigh }}
                                    />
                                    <input
                                        type="tel"
                                        value={contact.phone}
                                        onChange={e => handleContactChange(idx, "phone", e.target.value)}
                                        placeholder="Phone"
                                        className="h-11 px-3 rounded-xl border-none outline-none text-white text-sm font-medium"
                                        style={{ background: C.surfaceContainerHigh }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {errorMsg && (
                        <div className="p-4 rounded-[24px] text-left flex items-start gap-3 border border-red-500/20 bg-red-950/20 text-red-200 mt-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
                            <p className="text-[13px] font-medium leading-relaxed">{errorMsg}</p>
                        </div>
                    )}

                    <button
                        onClick={handleFinishSetup}
                        className="w-full h-15 rounded-full flex items-center justify-center gap-2 text-[17px] font-black cursor-pointer border-none outline-none md-ripple active:scale-95 transition-all mt-2"
                        style={{ background: C.primary, color: C.onPrimary }}
                    >
                        Finish Setup <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}