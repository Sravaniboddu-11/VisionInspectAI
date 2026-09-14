const uploadImage = async () => {
  if (!image) {
    alert("Please select an image.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login again.");
    return;
  }

  const formData = new FormData();
  formData.append("file", image);

  setLoading(true);
  setMessage("");

  try {
    const response = await api.post(
      "/upload/image",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Upload Response:", response.data);

    const filename = response.data?.filename;

    if (!filename) {
      throw new Error(
        "Backend did not return an image filename."
      );
    }

    setMessage(
      response.data?.message ||
        "Image uploaded successfully."
    );

    localStorage.setItem(
      "uploadedImage",
      filename
    );

    localStorage.setItem(
      "uploadedImageUrl",
      `https://visioninspectai-backend-lnih.onrender.com/uploads/${encodeURIComponent(
        filename
      )}`
    );

    alert("Image uploaded successfully!");

  } catch (error) {
    console.error("Upload Error:", error);

    if (error.response) {
      console.log(
        "Status:",
        error.response.status
      );

      console.log(
        "Backend Error:",
        error.response.data
      );

      const data = error.response.data;

      let message = "Upload failed.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (data?.detail) {
        message = JSON.stringify(
          data.detail,
          null,
          2
        );
      }

      alert(`Upload failed:\n\n${message}`);

    } else if (error.request) {
      alert(
        "Cannot connect to backend.\n\nNo response was received from the server."
      );

    } else {
      alert(
        `Request error:\n\n${error.message}`
      );
    }

  } finally {
    setLoading(false);
  }
};