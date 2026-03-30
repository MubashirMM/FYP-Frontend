import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <h1 className="welcome-text"> اسٹور میں خوش آمدید</h1>
      <div className="options">
        <Link to="/register" className="option-btn">اکاؤنٹ بنائیں</Link>
        {/* <Link to="/login" className="option-btn">اگر پہلے سے اکاؤنٹ ہے تو لاگ ان کریں</Link> */}
        <Link to="/login" className="option-btn"> لاگ ان کریں</Link>

      </div>
    </div>
  );
}

export default Home;
