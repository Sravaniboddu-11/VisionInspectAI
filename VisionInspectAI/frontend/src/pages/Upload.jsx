} catch (error) {
  console.error("Upload Error:", error);

  if (error.response) {
    console.log(
      "Upload Status:",
      error.response.status
    );

    console.log(
      "Upload Backend Error:",
      error.response.data
    );

    const data = error.response.data;

    let backendMessage = "Upload failed.";

    if (typeof data?.detail === "string") {
      backendMessage = data.detail;
    } else if (data?.detail) {
      backendMessage = JSON.stringify(
        data.detail,
        null,
        2
      );
    } else if (typeof data?.message === "string") {
      backendMessage = data.message;
    } else if (data) {
      backendMessage = JSON.stringify(
        data,
        null,
        2
      );
    }

    alert(
      `Upload failed:\n\n${backendMessage}`
    );
  } else if (error.request) {
    alert(
      "Cannot connect to backend.\n\nNo response was received from the server."
    );
  } else {
    alert(
      `Request error:\n\n${error.message}`
    );
  }
}