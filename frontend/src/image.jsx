import { useState, useRef } from "react";

export default function Image() {
  const [coords, setCoords] = useState(null);
  const imgRef = useRef(null);

  const handleClick = (e) => {
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const x = Math.round(clickX * scaleX);
    const y = Math.round(clickY * scaleY);

    setCoords({ x, y });
  };

  return (
    <div>
      <img
        ref={imgRef}
        src="https://community-cdn.openstreetmap.org/uploads/default/original/3X/4/0/407cf3c09635f6acdc36d9a28f5534f25eafea31.jpeg"
        alt="Example Image"
        onClick={handleClick}
        style={{ cursor: "crosshair", maxWidth: "100%", height: "auto" }}
      />
      {coords && (
        <p>
          You clicked at: (<strong>{coords.x}</strong>,{" "}
          <strong>{coords.y}</strong>)
        </p>
      )}
    </div>
  );
}
