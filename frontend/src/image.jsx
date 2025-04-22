import { useState, useRef, useEffect } from "react";

const auth = window.osmAuth.osmAuth({
  client_id: "cJmOITzl1zLD8-XwfNTMXmtOMVJSXppey8Dg0Y2UrAs",
  scope: "read_prefs",
  redirect_uri: `${window.location.origin}/osm-auth-get-and-post/land.html`,
  singlepage: false,
});

export default function Image() {
  const [imageUrl, setImageUrl] = useState(null);
  const [helperUrl, setHelperUrl] = useState(null);
  const imgRef = useRef(null);

  const fetchImageUrl = async () => {
    const res = await fetch("https://premap.fly.dev/get");
    const data = await res.json();
    setImageUrl(data.URL);
    setHelperUrl(data.helperUrl);
  };

  function sendReview(x, y, sidelength_in_pixels) {
    auth.xhr(
      {
        method: "POST",
        path: `https://premap.fly.dev/post`,
        //path: `http://0.0.0.0:8080/post`,
        prefix: false,
        content: JSON.stringify({
          URL: imageUrl,
          sidelength_in_pixels: sidelength_in_pixels,
          x: x,
          y: y,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
      (err, res) => {
        fetchImageUrl(); // fetch a new image after sending review
      }
    );
  }

  useEffect(() => {
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

    sendReview(x, y, rect.width);
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
          <img
            src={helperUrl}
            style={{
              width: "256px",
              height: "256px",
              objectFit: "cover",
            }}
          />
        </>
      ) : (
        <p>Loading image...</p>
      )}
      <div>
        On the leftmost image, click on the place where a power pole meets the
        ground!
      </div>
      <button onClick={() => sendReview(-99, -99, -99)}>
        I can't confidently locate a power pole on this image
      </button>
    </div>
  );
}
