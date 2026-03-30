import { useState } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

function UrduKeyboardInput({ value, onChange, placeholder }) {
  const [keyboardInput, setKeyboardInput] = useState(value);

  const handleChange = (input) => {
    setKeyboardInput(input);
    onChange(input);
  };

  return (
    <div>
      <input
        type="text"
        value={keyboardInput}
        onChange={(e) => handleChange(e.target.value)}
        lang="ur"
        placeholder={placeholder}
        className="border p-2 w-full mb-2"
      />
      <Keyboard
        layout={{
          default: [
            "ض ص ث ق ف غ ع ہ خ ح ج چ",
            "ش س ی ب ل ا ت ن م پ",
            "ظ ط ز ر ذ د ڈ و"
          ]
        }}
        onChange={handleChange}
      />
    </div>
  );
}

export default UrduKeyboardInput;
