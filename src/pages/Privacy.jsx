// src/pages/Privacy.jsx
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";

function Privacy() {
    const [user, setUser] = useState(null);
    const isAuthenticated = !!localStorage.getItem("token");
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (isAuthenticated) {
            fetchUser();
        }
    }, [isAuthenticated]);

    const fetchUser = async () => {
        try {
            const response = await fetch(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Header isAuthenticated={isAuthenticated} user={user} />

            <main className="flex-1 py-12 md:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 font-urdu"
                    >
                        <span>→</span>
                        واپس جائیں
                    </Link>

                    {/* Privacy Content */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                                🔒
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-urdu mb-2">
                                رازداری کی پالیسی
                            </h1>
                            <p className="text-gray-500 font-urdu">آخری بار اپ ڈیٹ: مارچ 2026</p>
                        </div>

                        <div className="space-y-6 font-urdu text-gray-700 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">📋</span>
                                    ہم کون ہیں؟
                                </h2>
                                <p className="text-gray-600">
                                    360 آسان اسٹور ایک سمارٹ اسٹور مینجمنٹ سسٹم ہے جو آپ کو ادھار، بل، اور
                                    اسٹور آئٹمز کو آسانی سے مینج کرنے میں مدد کرتا ہے۔ ہم آپ کی معلومات کی حفاظت
                                    کو انتہائی اہمیت دیتے ہیں۔
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">📊</span>
                                    ہم کونسی معلومات جمع کرتے ہیں؟
                                </h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 mr-4">
                                    <li>نام، ای میل، اور رابطہ نمبر</li>
                                    <li>اسٹور کی معلومات (اسٹور کا نام، پتہ)</li>
                                    <li>ادھار اور بل کی تفصیلات</li>
                                    <li>آئٹمز اور مصنوعات کی معلومات</li>
                                    <li>آواز کی کمانڈز (صرف آپ کی درخواست پر)</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">🔐</span>
                                    ہم آپ کی معلومات کا استعمال کیسے کرتے ہیں؟
                                </h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 mr-4">
                                    <li>آپ کے اکاؤنٹ کو منظم کرنے کے لیے</li>
                                    <li>ادھار اور بل کی معلومات کو محفوظ رکھنے کے لیے</li>
                                    <li>وائس کمانڈز کو پروسیس کرنے کے لیے</li>
                                    <li>رپورٹس اور تجزیہ فراہم کرنے کے لیے</li>
                                    <li>آپ کے تجربے کو بہتر بنانے کے لیے</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">🛡️</span>
                                    ڈیٹا سیکیورٹی
                                </h2>
                                <p className="text-gray-600">
                                    ہم آپ کے ڈیٹا کو محفوظ رکھنے کے لیے جدید ترین سیکیورٹی ٹیکنالوجیز استعمال کرتے ہیں۔
                                    آپ کا تمام ڈیٹا انکرپٹڈ ہے اور صرف آپ ہی اس تک رسائی حاصل کر سکتے ہیں۔ ہم کبھی بھی
                                    آپ کی ذاتی معلومات کو بغیر اجازت کے تیسرے فریق کے ساتھ شیئر نہیں کرتے۔
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">🍪</span>
                                    کوکیز (Cookies)
                                </h2>
                                <p className="text-gray-600">
                                    ہم آپ کے تجربے کو بہتر بنانے کے لیے کوکیز استعمال کرتے ہیں۔ آپ اپنے براؤزر کی
                                    سیٹنگز میں کوکیز کو کنٹرول کر سکتے ہیں۔
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">👤</span>
                                    آپ کے حقوق
                                </h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 mr-4">
                                    <li>اپنی ذاتی معلومات تک رسائی حاصل کریں</li>
                                    <li>غلط معلومات کو درست کریں</li>
                                    <li>اپنا ڈیٹا ڈاؤن لوڈ کریں</li>
                                    <li>اپنا اکاؤنٹ ڈیلیٹ کریں</li>
                                    <li>مارکیٹنگ مواصلات سے انکار کریں</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="text-purple-600">📞</span>
                                    ہم سے رابطہ کریں
                                </h2>
                                <p className="text-gray-600">
                                    اگر آپ کے پاس کوئی سوالات یا خدشات ہیں تو براہ کرم ہم سے رابطہ کریں:
                                </p>
                                <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-2">
                                    <p className="flex items-center gap-2">
                                        <span>📧</span>
                                        <span>support@360asanshop.com</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span>📞</span>
                                        <span>0300 1234567</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span>📍</span>
                                        <span>پاکستان</span>
                                    </p>
                                </div>
                            </section>

                            <div className="bg-purple-50 rounded-xl p-4 mt-6 border border-purple-100">
                                <p className="text-purple-800 text-sm font-urdu text-center">
                                    🔒 آپ کی رازداری ہمارے لیے اہم ہے۔ ہم آپ کے ڈیٹا کو محفوظ رکھنے کے لیے پرعزم ہیں۔
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer isAuthenticated={isAuthenticated} />
        </div>
    );
}

export default Privacy;