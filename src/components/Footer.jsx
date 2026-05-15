// src/components/Footer.jsx
import { Link } from "react-router-dom";

function Footer({ isAuthenticated }) {
  const sections = [
    {
      title: "انتظامیہ (Management)",
      links: [
        { label: "📦 آئٹمز مینجمنٹ", to: "/items" },
        { label: "📄 بلز مینجمنٹ", to: "/bills" },
        { label: "🛒 اسٹور سیٹنگز", to: "/shop" },
        { label: "👤 پروفائل", to: "/profile" },
      ],
    },
    {
      title: "لین دین (Transactions)",
      links: [
        { label: "📒 کھاتہ کتاب", to: "/khata" },
        { label: "📋 اُدھار آئٹمز", to: "/udhaar-items" },
        { label: "📝 نقد آئٹمز", to: "/bill-items" },
        { label: "💰 فروخت ریکارڈ", to: "/sales" },
      ],
    },
    {
      title: "رپورٹس (Analysis)",
      links: [
        { label: "📊 فروخت رپورٹ", to: "/sales-report" },
        { label: "🔮 پیشن گوئی رپورٹ", to: "/forecast-report" },
        { label: "📜 بل ہسٹری", to: "/bill-item-history" },
      ],
    },
  ];

  // Social media links configuration
  const socialLinks = [
    {
      name: "Facebook",
      icon: "📘",
      url: "https://www.facebook.com/360asanshop",
      hoverColor: "hover:bg-blue-600",
      bgColor: "bg-blue-600"
    },
    {
      name: "WhatsApp",
      icon: "💬",
      url: "https://web.whatsapp.com/",
      hoverColor: "hover:bg-green-600",
      bgColor: "bg-green-600"
    },
    {
      name: "YouTube",
      icon: "📺",
      url: "https://www.youtube.com/@360asanshop",
      hoverColor: "hover:bg-red-600",
      bgColor: "bg-red-600"
    },
    {
      name: "Instagram",
      icon: "📷",
      url: "https://www.instagram.com/360asanshop",
      hoverColor: "hover:bg-pink-600",
      bgColor: "bg-pink-600"
    },
    {
      name: "TikTok",
      icon: "🎵",
      url: "https://www.tiktok.com/@360asanshop",
      hoverColor: "hover:bg-black",
      bgColor: "bg-black"
    },
    {
      name: "Twitter/X",
      icon: "🐦",
      url: "https://twitter.com/360asanshop",
      hoverColor: "hover:bg-blue-400",
      bgColor: "bg-blue-400"
    }
  ];

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                🏪
              </div>
              <span className="text-2xl font-black font-urdu tracking-tight">360 آسان اسٹور</span>
            </div>
            <p className="text-gray-400 font-urdu leading-relaxed text-sm">
              اردو وائس سپورٹ کے ساتھ جدید اسٹور مینجمنٹ سسٹم۔ اپنے کاروبار کو ڈیجیٹل بنائیں، بل بنائیں اور کھاتہ سنبھالیں - سب کچھ ایک جگہ۔
            </p>

            {/* Social Media Icons with Tooltips */}
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center ${social.hoverColor} hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-700`}
                  aria-label={social.name}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                    {social.icon}
                  </span>

                  {/* Tooltip on hover */}
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-urdu">
                    {social.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Dynamic Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-5">
              <h4 className="text-white font-bold text-lg font-urdu border-r-4 border-blue-500 pr-3">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      to={link.to}
                      className="text-gray-400 hover:text-blue-400 transition-colors font-urdu text-sm flex items-center gap-2 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">←</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright area */}
        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500 text-xs font-urdu space-y-1 text-center md:text-right">
            <p>© 2026 360 آسان اسٹور۔ تمام حقوق محفوظ ہیں۔</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-sans">Developed for Smart Retail Management</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-urdu">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              سسٹم آن لائن ہے
            </div>
            <div className="h-4 w-px bg-gray-800"></div>
            <div className="flex gap-4">
              <Link to="/help" className="text-gray-500 hover:text-white text-xs font-urdu">مدد</Link>
              <Link
                to="/privacy"
                target="_blank"
                className="text-gray-500 hover:text-white text-xs font-urdu"
              >
                پرائیویسی
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;