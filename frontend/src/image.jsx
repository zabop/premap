import { useState, useRef, useEffect } from "react";

const auth = window.osmAuth.osmAuth({
  client_id: "cJmOITzl1zLD8-XwfNTMXmtOMVJSXppey8Dg0Y2UrAs",
  scope: "read_prefs",
  redirect_uri: `${window.location.origin}/osm-auth-get-and-post/land.html`,
  singlepage: false,
});

export default function Image() {
  const [coords, setCoords] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const imgRef = useRef(null);

  function sendReview(x, y) {
    auth.xhr(
      {
        method: "POST",
        path: `https://premap.fly.dev/post`,
        //path: `http://0.0.0.0:8080/post`,
        prefix: false,
        content: JSON.stringify({ URL: imageUrl, x: x, y: y }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
      (err, res) => {
        console.log("review sent");
      }
    );
  }

  useEffect(() => {
    const fetchImageUrl = async () => {
      const res = await fetch("https://premap.fly.dev/get");
      //const res = await fetch("http://0.0.0.0:8080/get");
      const data = await res.json();
      setImageUrl(data.URL);
    };
    fetchImageUrl();
  }, []);

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
    sendReview(x, y);
  };

  return (
    <div>
      {imageUrl ? (
        <>
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Loaded from API"
            onClick={handleClick}
            style={{ cursor: "crosshair", maxWidth: "100%", height: "auto" }}
          />
          {coords && (
            <p>
              You clicked at: ({coords.x}, {coords.y})
            </p>
          )}
        </>
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
}
