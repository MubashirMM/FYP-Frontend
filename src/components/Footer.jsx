// src/components/Footer.jsx
import { Link } from "react-router-dom";

function Footer({ isAuthenticated }) {
  const footerLinks = {
    product: [
      { label: "فیچرز", link: "#" },
      { label: "پرائسنگ", link: "#" },
      { label: "اپ ڈیٹس", link: "#" },
      { label: "روڈ میپ", link: "#" }
    ],
    support: [
      { label: "ہیلپ سینٹر", link: "#" },
      { label: "ڈاکیومنٹیشن", link: "/docs" },
      { label: "API گائیڈ", link: "/api-docs" },
      { label: "رابطہ کریں", link: "#" }
    ],
    company: [
      { label: "ہمارے بارے میں", link: "#" },
      { label: "پرائیویسی", link: "#" },
      { label: "شرائط", link: "#" },
      { label: "کیریئر", link: "#" }
    ]
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                🏪
              </div>
              <span className="text-xl font-bold font-urdu">میرا اسٹور</span>
            </div>
            <p className="text-gray-400 font-urdu leading-relaxed mb-4">
              اردو وائس سپورٹ کے ساتھ اسمارٹ اسٹور مینجمنٹ سسٹم۔ 
              آسان، تیز، اور جدید۔
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">
                📘
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">
                🐦
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">
                💬
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-urdu">پروڈکٹ</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, idx) => (
                <li key={idx}>
                  <a href={link.link} className="text-gray-400 hover:text-white transition-colors font-urdu flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-urdu">سپورٹ</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, idx) => (
                <li key={idx}>
                  <a href={link.link} className="text-gray-400 hover:text-white transition-colors font-urdu flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 font-urdu">کمپنی</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <a href={link.link} className="text-gray-400 hover:text-white transition-colors font-urdu flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-urdu">
            © 2026 میرا اسٹور۔ تمام حقوق محفوظ ہیں۔
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-white transition-colors font-urdu">پرائیویسی</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors font-urdu">شرائط</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors font-urdu">کوکیز</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;