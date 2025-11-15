import { useNavigate } from "react-router-dom";
import startIcon from "@/assets/smart.svg";
import arrowIcon from "@/assets/arrow.svg";
import "@/styles/HomeEntry.css";

export default function HomeEntry() {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <article className="landing-page">
      <div className="landing-title">
        <h2 className="entry-title">Welcome to Smart Tourist Safety System</h2>
        <h3 className="entry-subtitle">
          Stay safe, stay connected — anywhere you travel
        </h3>
      </div>

      <div className="landing-register">
        <button className="register-button" onClick={goToRegister}>
          <img className="reg-but-img" src={startIcon} alt="start" />
          Register as Tourist
          <img className="reg-but-img" src={arrowIcon} alt="end" />
        </button>
      </div>
    </article>
  );
}
