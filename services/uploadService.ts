const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";


export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.path; // "/uploads/xxxx.png"
};
console.log("UPLOAD BASE URL:", BASE_URL);
